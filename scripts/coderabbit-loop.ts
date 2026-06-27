#!/usr/bin/env tsx
/**
 * coderabbit-loop.ts — Poll CodeRabbit reviews, apply inline fixes, loop until green light.
 *
 * Exit codes:
 *   0  GREEN LIGHT — no pending threads, checklist resolved, review approved
 *   1  Checklist pending without inline comments — manual intervention needed
 *   2  MAX_LOOPS exhausted without green light — manual intervention needed
 *   3+ API or runtime error
 *
 * Usage:
 *   tsx scripts/coderabbit-loop.ts <PR_NUMBER> [BRANCH_NAME]
 *
 * Env:
 *   GH_OWNER   (default: schlemperdev)
 *   GH_REPO    (default: shantycrawl-mcp)
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Config ──────────────────────────────────────────────────────────
const OWNER = process.env.GH_OWNER ?? "schlemperdev";
const REPO = process.env.GH_REPO ?? "shantycrawl-mcp";
const MAX_LOOPS = 5;
const POLL_INTERVAL_SEC = 60;
const RE_REVIEW_WAIT_SEC = 120;
const BOT_PATTERN = /coderabbit/i;

// ── Args ────────────────────────────────────────────────────────────
const PR = Number(process.argv[2]);
if (!PR || !Number.isInteger(PR) || PR < 1) {
  console.error("Usage: tsx scripts/coderabbit-loop.ts <PR_NUMBER> [BRANCH]");
  process.exit(3);
}
const BRANCH = process.argv[3] ?? execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf-8" }).trim();

// ── Helpers ─────────────────────────────────────────────────────────
const gh = (endpoint: string, jq?: string): string => {
  const args = jq ? ["api", endpoint, "--jq", jq] : ["api", endpoint];
  return execFileSync("gh", args, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }).trim();
};

const ghRaw = (endpoint: string): string => {
  return execFileSync("gh", ["api", endpoint], { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }).trim();
};

const sleep = (sec: number) =>
  new Promise((r) => setTimeout(r, sec * 1000));

const log = (msg: string) =>
  console.log(`[${new Date().toISOString()}] ${msg}`);

const ghComment = (body: string) => {
  execFileSync("gh", ["pr", "comment", String(PR), "--body", body], { encoding: "utf-8" });
};

// ── GitHub types ────────────────────────────────────────────────────
interface ReviewComment {
  id: number;
  path: string;
  line: number | null;
  start_line: number | null;
  side: "LEFT" | "RIGHT";
  body: string;
  user: { login: string };
  outdated: boolean;
  subject_type: "line" | "file";
}

interface Review {
  id: number;
  user: { login: string };
  state: string;
  body: string;
  submitted_at: string;
}

// ── Paginated GitHub API helper ─────────────────────────────────────
/**
 * Fetch all pages from a GitHub REST endpoint.
 * Assumes the base URL already has its first `?` (e.g. `/repos/.../pulls/1/comments`).
 */
function paginateGh<T>(endpoint: string): T[] {
  let page = 1;
  const all: T[] = [];
  const sep = endpoint.includes("?") ? "&" : "?";
  while (true) {
    const raw = execFileSync("gh", ["api", `${endpoint}${sep}per_page=100&page=${page}`], {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    }).trim();
    const items: T[] = JSON.parse(raw);
    if (items.length === 0) break;
    all.push(...items);
    page++;
  }
  return all;
}

// ── API wrappers ────────────────────────────────────────────────────
const getBotReviews = (): Review[] => {
  const all = paginateGh<Review>(`/repos/${OWNER}/${REPO}/pulls/${PR}/reviews`);
  return all.filter((r) => BOT_PATTERN.test(r.user?.login ?? ""));
};

const getActiveInlineComments = (): ReviewComment[] => {
  const all = paginateGh<ReviewComment>(`/repos/${OWNER}/${REPO}/pulls/${PR}/comments`);
  return all.filter(
    (c) => BOT_PATTERN.test(c.user?.login ?? "") && c.outdated !== true,
  );
};

// ── Suggestion parsing ──────────────────────────────────────────────
/**
 * Extract CodeRabbit suggestion from comment body.
 * Priority:
 *   1. GitHub suggestion fence: `````suggestion\n...\n`````
 *   2. Code block with language: `````<lang>\n...\n`````
 * Returns { code, language } or null.
 * Only the FIRST suggestion/code block is used.
 */
function extractSuggestion(body: string): { code: string; language: string } | null {
  // GitHub suggestion fence
  const sugMatch = body.match(/```suggestion\n([\s\S]*?)\n```/);
  if (sugMatch) return { code: sugMatch[1].trimEnd(), language: "suggestion" };

  // Code blocks with explicit language
  const codeMatch = body.match(/```(\w+)\n([\s\S]*?)\n```/);
  if (codeMatch) return { code: codeMatch[2].trimEnd(), language: codeMatch[1] };

  // Fallback: plain code fence (no language)
  const plainMatch = body.match(/```\n([\s\S]*?)\n```/);
  if (plainMatch) return { code: plainMatch[1].trimEnd(), language: "" };

  return null;
}

// ── Fix application ─────────────────────────────────────────────────
/**
 * Apply a single CodeRabbit inline suggestion to the local file.
 * Replaces lines [startLine, endLine] (1-indexed, inclusive) with suggestion code.
 *
 * ponytail: naive line swap — doesn't handle partial-line diffs or
 * context-aware merge. Upgrade to `patch`-based merge if CodeRabbit
 * starts sending hunks instead of full-line suggestions.
 */
function applyFix(comment: ReviewComment): boolean {
  const sug = extractSuggestion(comment.body);
  if (!sug) {
    log(`  ↪ No code block found in comment #${comment.id}, skipping`);
    return false;
  }

  const filePath = resolve(comment.path);
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    log(`  ⚠ File not found: ${comment.path}, skipping`);
    return false;
  }

  const lines = content.split("\n");
  // Determine target line range (1-indexed, inclusive)
  let startLine: number;
  let endLine: number;

  if (comment.start_line && comment.line) {
    // Multi-line comment
    startLine = Math.min(comment.start_line, comment.line);
    endLine = Math.max(comment.start_line, comment.line);
  } else if (comment.line) {
    // Single-line comment
    startLine = comment.line;
    endLine = comment.line;
  } else {
    // ponytail: file-level comment — ignore, can't map to specific lines
    log(`  ↪ No line reference in comment #${comment.id}, skipping`);
    return false;
  }

  if (startLine < 1 || endLine > lines.length) {
    log(`  ⚠ Line range ${startLine}-${endLine} out of bounds (file has ${lines.length} lines), skipping`);
    return false;
  }

  const sugLines = sug.code.split("\n");
  const before = lines.slice(0, startLine - 1);
  const after = lines.slice(endLine);
  const newContent = [...before, ...sugLines, ...after].join("\n");

  writeFileSync(filePath, newContent, "utf-8");
  log(`  ✓ Applied fix: ${comment.path}:${startLine}-${endLine} (${sugLines.length} lines)`);
  return true;
}

// ── GREEN LIGHT check ───────────────────────────────────────────────
interface GreenLightResult {
  green: boolean;
  pendingInlines: number;
  uncheckedChecklist: number;
  reviewState: string;
}

function checkGreenLight(
  comments: ReviewComment[],
  reviews: Review[],
): GreenLightResult {
  const pendingInlines = comments.length;

  // Latest bot review body → count unchecked checklist items
  const latestReview = reviews.length > 0 ? reviews[reviews.length - 1] : null;
  const reviewState = latestReview?.state ?? "NONE";
  const body = latestReview?.body ?? "";

  // Match `- [ ]` but not `- [x]`
  const uncheckedMatch = body.match(/- \[ \]/g);
  const uncheckedChecklist = uncheckedMatch?.length ?? 0;

  // CodeRabbit edits its existing review body to indicate no action needed.
  // Detect this even if inline comments from a prior review are still active.
  const noActionSignal = /no actionable comments/i.test(body);

  const green =
    noActionSignal ||
    (pendingInlines === 0 &&
     uncheckedChecklist === 0 &&
     (reviewState === "APPROVED" || reviewState === "COMMENTED"));

  return { green, pendingInlines, uncheckedChecklist, reviewState };
}

// ── Main loop ───────────────────────────────────────────────────────
async function main(): Promise<number> {
  log(`CodeRabbit loop started — PR #${PR} branch=${BRANCH}`);

  let reviews: Review[] = [];
  let loopCount = 0;

  // ─── Wait for first review ─────────────────────────────────────
  log("Waiting for CodeRabbit to post first review...");
  while (loopCount < MAX_LOOPS) {
    loopCount++;
    reviews = getBotReviews();
    if (reviews.length > 0) {
      log(`CodeRabbit review found (${reviews.length} total). Latest state: ${reviews[reviews.length - 1].state}`);
      break;
    }
    log(`  No review yet (attempt ${loopCount}/${MAX_LOOPS}), sleeping ${POLL_INTERVAL_SEC}s...`);
    await sleep(POLL_INTERVAL_SEC);
  }

  if (reviews.length === 0) {
    log("✖ CodeRabbit never reviewed — timeout");
    ghComment("⏰ CodeRabbit did not post a review within the polling window. Manual review required.");
    return 3;
  }

  // ─── Iterative fix loop ────────────────────────────────────────
  let totalFixes = 0;
  const processedComments = new Set<number>();
  loopCount = 0;

  while (loopCount < MAX_LOOPS) {
    loopCount++;
    log(`── Iteration ${loopCount}/${MAX_LOOPS} ──`);

    // Refresh data
    reviews = getBotReviews();
    const comments = getActiveInlineComments();

    // Apply descending line order per file (prevents index shift)
    comments.sort((a, b) => {
      if (a.path !== b.path) return a.path.localeCompare(b.path);
      const aLine = a.start_line ?? a.line ?? 0;
      const bLine = b.start_line ?? b.line ?? 0;
      return bLine - aLine;
    });

    // GREEN LIGHT check
    const status = checkGreenLight(comments, reviews);
    log(
      `  Status: pendingInlines=${status.pendingInlines} ` +
      `checklist=${status.uncheckedChecklist} ` +
      `reviewState=${status.reviewState}`,
    );

    if (status.green) {
      log("✅ GREEN LIGHT — no pending threads, checklist resolved, review approved");
      return 0;
    }

    // ─── Apply fixes from inline comments ONLY ───────────────────
    // Safeguard 1: checklist never drives code changes — only inline comments.
    let fixesThisRound = 0;
    for (const c of comments) {
      let fixesThisRound = 0;
      let sawProcessedComments = false;
      for (const c of comments) {
        if (processedComments.has(c.id)) {
          sawProcessedComments = true;
          log(`  ↪ Comment #${c.id} already processed, skipping`);
          continue;
        }
        log(`  Processing comment #${c.id} — ${c.path}:${c.line ?? "?"}`);
        const applied = applyFix(c);
        if (applied) {
          fixesThisRound++;
          processedComments.add(c.id);
        }
      }

      if (comments.length > 0 && sawProcessedComments && comments.every(c => processedComments.has(c.id))) {
        log(`  Waiting ${RE_REVIEW_WAIT_SEC}s for CodeRabbit to refresh active comments...`);
        await sleep(RE_REVIEW_WAIT_SEC);
        continue;
      }
    }

    if (fixesThisRound > 0) {
      totalFixes += fixesThisRound;
      log(`  ${fixesThisRound} fix(es) applied (total: ${totalFixes}). Committing and pushing...`);

      execFileSync("git", ["add", "-A"], { encoding: "utf-8" });
      execFileSync("git", ["commit", "-m", "fix: address coderabbit code review feedback"], { encoding: "utf-8" });
      execFileSync("git", ["push", "origin", BRANCH], { encoding: "utf-8" });

      log(`  Changes pushed. Waiting ${RE_REVIEW_WAIT_SEC}s for CodeRabbit to re-review...`);
      await sleep(RE_REVIEW_WAIT_SEC);
      continue;
    }

    // ─── All comments already addressed, but CodeRabbit didn't re-review ──
    // Fallback: if no fixes applied and every remaining comment has
    // "✅ Addressed" in its body, consider green light achieved.
    if (comments.length > 0) {
      const allAddressed = comments.every(c =>
        /✅\s*Addressed/i.test(c.body ?? "")
      );
      if (allAddressed) {
        log("✅ All remaining comments addressed — green light");
        return 0;
      }
    }

    // ─── No inline comments, but checklist pending ───────────────
    // Safeguard 1 edge case: only checklist items remain, can't auto-fix.
    if (status.uncheckedChecklist > 0) {
      log(`✖ ${status.uncheckedChecklist} checklist item(s) unresolved, no inline comments to fix`);
      ghComment(
        `@${OWNER} CodeRabbit has **${status.uncheckedChecklist} unresolved checklist item(s)** ` +
        "but no inline comments with code suggestions. Manual review needed.",
      );
      return 1;
    }

    // ─── Nothing to do, but still no green light ─────────────────
    log("✖ No fixes applied, no checklist pending, but green light not reached");
    ghComment(
      `@${OWNER} CodeRabbit auto-fix loop stalled. ` +
      `State: pendingInlines=${status.pendingInlines} ` +
      `checklist=${status.uncheckedChecklist} reviewState=${status.reviewState}. Manual review needed.`,
    );
    return 3;
  }

  // ─── MAX_LOOPS exhausted ───────────────────────────────────────
  log(`✖ MAX_LOOPS (${MAX_LOOPS}) reached without green light`);
  ghComment(
    `@${OWNER} ⚠️ Auto-fix loop reached **${MAX_LOOPS} iterations** without green light. ` +
    "Manual intervention required.",
  );
  return 2;
}

// ── Entry ───────────────────────────────────────────────────────────
main()
  .then((code) => {
    console.log(`\nExit code: ${code}`);
    process.exit(code);
  })
  .catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(3);
  });
