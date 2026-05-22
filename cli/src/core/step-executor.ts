import type { StepDefinition, StepResult, StepRetry } from './types'
import type { ICommandRunner } from '../ports/command-runner'
import type { ILogger } from '../ports/logger'
import { classifyError, isEmptyResultError } from './errors'
import { parseStepOutput } from './parsers'
import { isPipelineCommandAllowed } from './command-allowlist'

export async function executeStep(
  step: StepDefinition,
  runner: ICommandRunner,
  logger: ILogger,
): Promise<StepResult> {
  const allPipelines = [step.pipeline, ...(step.fallbackPipelines ?? [])]
  const allowed = allPipelines.filter(pl => {
    for (const cmd of pl) {
      if (!isPipelineCommandAllowed(cmd)) {
        logger.emit({ type: 'debug', message: `Blocked command in pipeline: ${cmd.program}` })
        return false
      }
    }
    return true
  })

  if (allowed.length === 0) {
    logger.emit({ type: 'step_failed', stepId: step.id, errorCode: 'BLOCKED_COMMAND' })
    return {
      step_id: step.id, status: 'failed', error_code: 'BLOCKED_COMMAND',
      error_message: 'All pipelines contain blocked commands', retries: [], duration_ms: 0,
    }
  }

  const retries: StepRetry[] = []
  const timeoutMs = step.timeout ?? 10_000

  for (const pipeline of allowed) {
    const label = pipeline.map(c => c.program).join(' | ')
    const start = Date.now()
    try {
      const rawOutput = await runner.runPipeline(pipeline, timeoutMs)
      const result = handleOutput(step, rawOutput, retries, start, logger)
      if (result) return result
    } catch (err: unknown) {
      const result = handleError(step, err, retries, start, label, logger)
      if (result) return result
    }
  }

  return buildFailResult(step, retries, logger)
}

function handleOutput(
  step: StepDefinition, rawOutput: string, retries: StepRetry[], start: number, logger: ILogger,
): StepResult | null {
  const trimmed = rawOutput.trim()
  if (!trimmed && step.onEmptyResult) {
    logger.emit({ type: 'step_completed', stepId: step.id })
    return {
      step_id: step.id, status: 'success', parsed_value: step.onEmptyResult.value,
      agent_note: step.onEmptyResult.note, retries, duration_ms: Date.now() - start,
    }
  }
  const parsedValue = parseStepOutput(rawOutput, step.parser)
  logger.emit({ type: 'step_completed', stepId: step.id })
  return {
    step_id: step.id, status: 'success', parsed_value: parsedValue,
    raw_output: rawOutput.slice(0, 500), retries, duration_ms: Date.now() - start,
  }
}

function handleError(
  step: StepDefinition, err: unknown, retries: StepRetry[], start: number,
  label: string, logger: ILogger,
): StepResult | null {
  if (isEmptyResultError(err) && step.onEmptyResult) {
    logger.emit({ type: 'step_completed', stepId: step.id })
    return {
      step_id: step.id, status: 'success', parsed_value: step.onEmptyResult.value,
      agent_note: step.onEmptyResult.note, retries, duration_ms: Date.now() - start,
    }
  }
  const errorMessage = err instanceof Error ? err.message : String(err)
  retries.push({ command: label, outcome: 'failed', error_message: errorMessage, duration_ms: Date.now() - start })
  logger.emit({ type: 'debug', message: `Step ${step.id} failed` })
  return null
}

function buildFailResult(step: StepDefinition, retries: StepRetry[], logger: ILogger): StepResult {
  const errorCode = classifyError(retries[0]?.error_message ?? '')
  logger.emit({ type: 'step_failed', stepId: step.id, errorCode })
  return {
    step_id: step.id, status: 'failed', error_code: errorCode,
    error_message: retries[retries.length - 1]?.error_message,
    retries, duration_ms: retries.reduce((sum, r) => sum + r.duration_ms, 0),
  }
}
