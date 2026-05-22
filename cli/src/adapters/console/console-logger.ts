import type { ILogger, LogEvent } from '../../ports/logger'
import type { SupportedLocale } from '../../core/types'

const PHASE_MESSAGES: Record<SupportedLocale, Record<string, string>> = {
  es: {
    fetch_plan: '  Obteniendo plan de auditoría...',
    detect_environment: '  Detectando entorno...',
    execute_steps: '  Ejecutando checks...',
    validate_preflight: '  Validando contrato...',
    submit_report: '  Enviando resultados...',
    'submit_report:done': '\n  ✓ Auditoría completada.\n  Recibirás el informe en tu dashboard en los próximos minutos.\n',
  },
  en: {
    fetch_plan: '  Fetching audit plan...',
    detect_environment: '  Detecting environment...',
    execute_steps: '  Running checks...',
    validate_preflight: '  Validating contract...',
    submit_report: '  Sending results...',
    'submit_report:done': '\n  ✓ Audit completed.\n  You will receive the report in your dashboard shortly.\n',
  },
}

export class ConsoleLogger implements ILogger {
  constructor(
    private debug: boolean,
    private locale: SupportedLocale,
  ) {}

  emit(event: LogEvent): void {
    const msgs = PHASE_MESSAGES[this.locale] ?? PHASE_MESSAGES.en
    switch (event.type) {
      case 'phase_started': {
        const msg = msgs[event.phase]
        if (msg) process.stdout.write(msg + '\n')
        break
      }
      case 'phase_completed': {
        const msg = msgs[`${event.phase}:done`]
        if (msg) process.stdout.write(msg + '\n')
        break
      }
      case 'info':
        process.stdout.write(event.message + '\n')
        break
      case 'step_completed':
        process.stdout.write(`    ✓ ${event.stepId}\n`)
        break
      case 'step_failed':
        process.stdout.write(`    ~ ${event.stepId}\n`)
        if (this.debug) process.stderr.write(`  Step ${event.stepId} failed: ${event.errorCode}\n`)
        break
      case 'step_skipped':
        process.stdout.write(`    ⊘ ${event.stepId}\n`)
        if (this.debug) process.stderr.write(`  Step ${event.stepId} skipped: ${event.reason}\n`)
        break
      case 'preflight_error':
        for (const err of event.errors) process.stderr.write(`  - ${err}\n`)
        break
      case 'payload_error':
        process.stderr.write(`\nPayload contract error: ${event.fields}\n`)
        process.stderr.write('This is a bug in the agent. Please report it.\n')
        break
      case 'debug':
        if (this.debug) process.stdout.write(`[debug] ${event.message}\n`)
        break
      case 'error':
        process.stderr.write(event.message + '\n')
        break
    }
  }
}
