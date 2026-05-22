import type { AgentPlan, AgentPayload, DetectedEnvironment, StepResult } from './types'

interface BuildPayloadParams {
  token: string
  plan: AgentPlan
  environment: DetectedEnvironment
  results: Record<string, unknown>
  stepResults: StepResult[]
  preflightIncomplete: boolean
  dryRun: boolean
  agentVersion: string
}

export function buildPayload(params: BuildPayloadParams): AgentPayload {
  return {
    token: params.token,
    plan_id: params.plan.plan_id,
    plan_version: params.plan.plan_version,
    agent_version: params.agentVersion,
    timestamp: new Date().toISOString(),
    dry_run: params.dryRun,
    preflight_incomplete: params.preflightIncomplete,
    server_context: params.plan.server_context,
    environment: params.environment,
    results: params.results,
    step_results: params.stepResults,
  }
}
