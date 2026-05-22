export function parseBoolean(raw: string): boolean {
  const lower = raw.toLowerCase().trim()
  return lower === 'true' || lower === 'yes' || lower === 'active' || lower === '1'
}
