import { z } from 'zod'

const stepResultSchema = z.object({
  step_id: z.string(),
  status: z.enum(['success', 'failed', 'skipped']),
  parsed_value: z.unknown().optional(),
  raw_output: z.string().optional(),
  retries: z.array(z.object({
    command: z.string(),
    outcome: z.literal('failed'),
    error_message: z.string(),
    duration_ms: z.number(),
  })).optional(),
  duration_ms: z.number(),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  agent_note: z.string().optional(),
})

export const agentPayloadSchema = z.object({
  token: z.string().min(1),
  plan_id: z.string(),
  plan_version: z.string(),
  agent_version: z.string(),
  timestamp: z.string(),
  dry_run: z.boolean(),
  preflight_incomplete: z.boolean(),
  server_context: z.record(z.string(), z.unknown()),
  environment: z.object({
    os: z.string(),
    kernel: z.string(),
    uptime_days: z.number(),
    public_ip: z.string().nullable(),
    detected_stack: z.record(z.string(), z.unknown()),
  }),
  results: z.record(z.string(), z.unknown()),
  step_results: z.array(stepResultSchema),
})
