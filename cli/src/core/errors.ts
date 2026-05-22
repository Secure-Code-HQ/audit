export function classifyError(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('aborted')) {
    return 'TIMEOUT'
  }
  if (msg.includes('permission denied') || msg.includes('operation not permitted')) {
    return 'PERMISSION_DENIED'
  }
  if (msg.includes('not found') || msg.includes('no such file') || msg.includes('command not found')) {
    return 'COMMAND_NOT_FOUND'
  }
  return 'UNKNOWN_ERROR'
}

export function isEmptyResultError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const e = err as Error & { code?: number | string; stderr?: string }
  if (e.code === 'ENOENT') return true
  return e.code === 1 && (!e.stderr || e.stderr.trim() === '')
}
