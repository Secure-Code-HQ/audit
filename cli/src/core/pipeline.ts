import type { StepDefinition, StepResult } from './types'
import type { ICommandRunner } from '../ports/command-runner'
import type { ILogger } from '../ports/logger'
import { executeStep } from './step-executor'
import { setNestedField } from './validation'

export async function runAllSteps(
  steps: StepDefinition[],
  runner: ICommandRunner,
  logger: ILogger,
  phase2TimeoutMs: number,
  defaultStepTimeoutMs: number,
): Promise<{ stepResults: StepResult[]; results: Record<string, unknown> }> {
  const stepResults: StepResult[] = []
  const results: Record<string, unknown> = {}
  const phase2Start = Date.now()

  for (const step of steps) {
    const elapsed = Date.now() - phase2Start
    if (elapsed >= phase2TimeoutMs) {
      logger.emit({ type: 'debug', message: 'Phase 2 timeout reached, skipping remaining steps' })
      logger.emit({ type: 'step_skipped', stepId: step.id, reason: 'global timeout' })
      stepResults.push({ step_id: step.id, status: 'skipped', duration_ms: 0 })
      continue
    }

    const remainingMs = phase2TimeoutMs - elapsed
    const stepTimeout = Math.min(step.timeout ?? defaultStepTimeoutMs, remainingMs)
    const stepWithTimeout = { ...step, timeout: stepTimeout }

    const result = await executeStep(stepWithTimeout, runner, logger)
    stepResults.push(result)

    if (result.status === 'success' && step.field) {
      setNestedField(results, step.field, result.parsed_value)
    }
  }

  return { stepResults, results }
}
