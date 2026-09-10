/** Privacy-safe timings. Enabled only when localStorage arena.diag=1. No payloads, URLs, or tokens. */

const marks = new Map<string, number>();

export function diagEnabled(): boolean {
  try {
    return localStorage.getItem("arena.diag") === "1";
  } catch {
    return false;
  }
}

export function mark(name: string): void {
  marks.set(name, performance.now());
}

export function measure(name: string, start: string): number | null {
  const t0 = marks.get(start);
  if (t0 === undefined) return null;
  const ms = Math.round(performance.now() - t0);
  if (diagEnabled()) {
    console.info(`[agent-mode] ${name}=${ms}ms`);
  }
  return ms;
}
