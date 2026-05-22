export function parseNumber(raw: string): number | null {
  const n = parseInt(raw.trim(), 10)
  return isNaN(n) ? null : n
}
