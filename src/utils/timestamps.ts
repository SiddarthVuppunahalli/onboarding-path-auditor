/**
 * Generates an ISO UTC timestamp string for the current moment.
 */
export function getIsoTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generates a unique, sortable run ID using the current time.
 * Format: run_YYYYMMDD_HHMMSS
 */
export function generateRunId(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = now.getUTCFullYear();
  const mm = pad(now.getUTCMonth() + 1);
  const dd = pad(now.getUTCDate());
  const hh = pad(now.getUTCHours());
  const min = pad(now.getUTCMinutes());
  const ss = pad(now.getUTCSeconds());
  
  return `run_${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

/**
 * Calculates the execution duration in seconds given high-res time markers.
 * Expects inputs from `Date.now()` or `performance.now()`.
 */
export function calculateDurationSec(startMs: number, endMs: number): number {
  return parseFloat(((endMs - startMs) / 1000).toFixed(2));
}
