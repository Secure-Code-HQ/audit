import type { AuditDeps } from './types'
import { runAllSteps } from './pipeline'
import { validatePreflight } from './validation'
import { buildPayload } from './payload-builder'
import { filterStepsByStack } from './stack-filter'

function maskToken(token: string): string {
  if (token.length <= 8) return '****'
  return `${token.slice(0, 4)}...${token.slice(-4)}`
}

export async function runAuditUseCase(deps: AuditDeps): Promise<void> {
  const {
    config, planProvider, envDetector, commandRunner,
    reportSender, planValidator, payloadValidator, logger,
  } = deps

  logger.emit({ type: 'debug', message: `Starting Server Audit Agent v${config.agentVersion}` })
  logger.emit({ type: 'debug', message: `Token: ${maskToken(config.token)}` })
  logger.emit({ type: 'debug', message: `Dry run: ${config.dryRun}` })
  logger.emit({ type: 'debug', message: `Locale: ${config.locale}` })

  logger.emit({ type: 'phase_started', phase: 'fetch_plan' })
  const rawPlan = await planProvider.fetch(config.token)
  const plan = planValidator.validate(rawPlan)

  logger.emit({ type: 'phase_started', phase: 'detect_environment' })
  const environment = await envDetector.detect()
  const activeStack = Object.keys(environment.detected_stack)
    .filter(k => environment.detected_stack[k as keyof typeof environment.detected_stack])
  logger.emit({ type: 'debug', message: `OS: ${environment.os}` })
  logger.emit({ type: 'debug', message: `Stack: ${activeStack.join(', ') || 'none detected'}` })

  const relevantSteps = filterStepsByStack(plan.steps, environment.detected_stack)
  logger.emit({ type: 'debug', message: `Steps: ${plan.steps.length} total, ${relevantSteps.length} relevant` })

  logger.emit({ type: 'phase_started', phase: 'execute_steps' })
  const { stepResults, results } = await runAllSteps(
    relevantSteps,
    commandRunner,
    logger,
    config.phase2TimeoutMs,
    config.stepTimeoutMs,
  )
  logger.emit({ type: 'debug', message: `Step results: ${stepResults.length} steps processed` })

  logger.emit({ type: 'phase_started', phase: 'validate_preflight' })
  const preflight = validatePreflight(results, plan.contract)

  if (!preflight.valid) {
    logger.emit({ type: 'preflight_error', errors: preflight.errors })
  }

  const preflightIncomplete = !preflight.valid

  const payload = buildPayload({
    token: config.token,
    plan,
    environment,
    results,
    stepResults,
    preflightIncomplete,
    dryRun: config.dryRun,
    agentVersion: config.agentVersion,
  })

  try {
    payloadValidator.validate(payload)
  } catch (err) {
    const fields = err instanceof Error ? err.message : String(err)
    logger.emit({ type: 'payload_error', fields })
    throw err
  }

  if (config.dryRun) {
    logger.emit({ type: 'info', message: '\n' + JSON.stringify(payload, null, 2) })
    return
  }

  logger.emit({ type: 'phase_started', phase: 'submit_report' })
  const submitResult = await reportSender.submit(payload, config.locale)

  if (!submitResult.success) {
    throw new Error(submitResult.error ?? `HTTP ${submitResult.statusCode}`)
  }

  logger.emit({ type: 'phase_completed', phase: 'submit_report' })
}
