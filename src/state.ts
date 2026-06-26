const activeTools = new Set<string>();

export function getActiveTools(): string[] {
  return Array.from(activeTools);
}

export function isToolActive(name: string): boolean {
  return activeTools.has(name);
}

export function activateTool(name: string): boolean {
  if (activeTools.has(name)) return false;
  activeTools.add(name);
  return true;
}

export function deactivateTool(name: string): boolean {
  return activeTools.delete(name);
}

