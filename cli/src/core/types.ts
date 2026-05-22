// Types for the Server Audit agent - standalone (no imports from packages/)

export interface StepOnEmptyResult {
  value: unknown
  note: string
}

export interface CommandSpec {
  program: string
  args: string[]
}

export interface StepDefinition {
  id: string
  field: string
  pipeline: CommandSpec[]
  fallbackPipelines?: CommandSpec[][]
  parser?: string
  timeout?: number
  onEmptyResult?: StepOnEmptyResult
}

export interface StepRetry {
  command: string
  outcome: 'failed'
  error_message: string
  duration_ms: number
}

export interface StepResult {
  step_id: string
  status: 'success' | 'failed' | 'skipped'
  parsed_value?: unknown
  raw_output?: string
  retries?: StepRetry[]
  duration_ms: number
  error_code?: string
  error_message?: string
  agent_note?: string
}

export interface ServerContext {
  network_exposure?: string
  server_purpose?: string
  data_sensitivity?: string
  [key: string]: unknown
}

export interface AuditContract {
  required?: string[]
  optional?: string[]
  forbidden?: string[]
}

export interface AgentPlan {
  plan_id: string
  plan_version: string
  steps: StepDefinition[]
  contract: AuditContract
  server_context: ServerContext
}

export interface DetectedSoftware {
  installed: boolean
  version?: string
  debian_version?: string
  version_precision?: 'full' | 'major_only'
}

export interface DetectedStack {
  podman?: boolean
  docker?: boolean
  docker_version?: string
  docker_debian_version?: string
  docker_version_precision?: string
  nodejs?: boolean
  nodejs_version?: string
  postgresql?: boolean
  postgresql_version?: string
  postgresql_debian_version?: string
  postgresql_version_precision?: string
  redis?: boolean
  redis_version?: string
  redis_debian_version?: string
  redis_version_precision?: string
  caddy?: boolean
  caddy_version?: string
  nginx?: boolean
  nginx_version?: string
  openssh?: boolean
  openssh_version?: string
  openssh_debian_version?: string
  openssh_version_precision?: string
  [key: string]: unknown
}

export interface DetectedEnvironment {
  os: string
  kernel: string
  uptime_days: number
  public_ip: string | null
  detected_stack: DetectedStack
}

export interface AgentPayload {
  token: string
  plan_id: string
  plan_version: string
  agent_version: string
  timestamp: string
  dry_run: boolean
  preflight_incomplete: boolean
  server_context: ServerContext
  environment: DetectedEnvironment
  results: Record<string, unknown>
  step_results: StepResult[]
}

// ─── Hexagonal types ─────────────────────────────────────────────────────────

export const SUPPORTED_LOCALES = ['es', 'en'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export interface PreflightResult {
  valid: boolean
  errors: string[]
}

export interface AgentConfig {
  token: string
  dryRun: boolean
  debug: boolean
  baseUrl: string
  locale: SupportedLocale
  agentVersion: string
  stepTimeoutMs: number
  phase2TimeoutMs: number
}

export interface AuditDeps {
  config: AgentConfig
  planProvider: import('../ports/plan-provider').IPlanProvider
  envDetector: import('../ports/env-detector').IEnvDetector
  commandRunner: import('../ports/command-runner').ICommandRunner
  reportSender: import('../ports/report-sender').IReportSender
  planValidator: import('../ports/plan-validator').IPlanValidator
  payloadValidator: import('../ports/payload-validator').IPayloadValidator
  logger: import('../ports/logger').ILogger
}
