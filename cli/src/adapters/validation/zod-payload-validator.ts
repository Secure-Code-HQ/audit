import type { IPayloadValidator } from '../../ports/payload-validator'
import type { AgentPayload } from '../../core/types'
import { agentPayloadSchema } from '../../schemas/payload.zod'

export class ZodPayloadValidator implements IPayloadValidator {
  validate(raw: unknown): AgentPayload {
    const result = agentPayloadSchema.safeParse(raw)
    if (!result.success) {
      const fields = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new Error(`Payload contract error: ${fields}`)
    }
    return result.data as AgentPayload
  }
}
