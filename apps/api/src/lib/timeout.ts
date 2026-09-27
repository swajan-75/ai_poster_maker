export class TimeoutError extends Error {
  constructor(label: string, ms: number) { super(`${label} timed out after ${ms}ms`); this.name = 'TimeoutError'; }
}
export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const t = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms); });
  return Promise.race([p, t]).finally(() => clearTimeout(timer));
}
