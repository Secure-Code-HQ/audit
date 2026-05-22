export type LogEvent =
  | { type: 'phase_started'; phase: string }
  | { type: 'phase_completed'; phase: string }
  | { type: 'step_completed'; stepId: string }
  | { type: 'step_failed'; stepId: string; errorCode: string }
  | { type: 'step_skipped'; stepId: string; reason: string }
  | { type: 'preflight_error'; errors: string[] }
  | { type: 'payload_error'; fields: string }
  | { type: 'debug'; message: string }
  | { type: 'info'; message: string }
  | { type: 'error'; message: string }

export interface ILogger {
  emit(event: LogEvent): void
}
