import { z } from 'zod'

const stepOnEmptyResultSchema = z.object({
  value: z.unknown(),
  note: z.string(),
})

const commandSpecSchema = z.object({
  program: z.string().min(1),
  args: z.array(z.string()),
})

const stepDefinitionSchema = z.object({
  id: z.string().min(1),
  field: z.string(),
  pipeline: z.array(commandSpecSchema).min(1),
  fallbackPipelines: z.array(z.array(commandSpecSchema).min(1)).optional(),
  parser: z.string().optional(),
  timeout: z.number().positive().optional(),
  onEmptyResult: stepOnEmptyResultSchema.optional(),
})

const auditContractSchema = z.object({
  required: z.array(z.string()).optional(),
  optional: z.array(z.string()).optional(),
})

const serverContextSchema = z.object({
  network_exposure: z.string().optional(),
  server_purpose: z.string().optional(),
  data_sensitivity: z.string().optional(),
}).passthrough()

export const agentPlanSchema = z.object({
  plan_id: z.string().min(1),
  plan_version: z.string().min(1),
  steps: z.array(stepDefinitionSchema).min(1),
  contract: auditContractSchema,
  server_context: serverContextSchema,
})
