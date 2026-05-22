import type { IPlanValidator } from '../../ports/plan-validator'
import type { AgentPlan } from '../../core/types'
import { agentPlanSchema } from '../../schemas/plan.zod'

export class ZodPlanValidator implements IPlanValidator {
  validate(raw: unknown): AgentPlan {
    const result = agentPlanSchema.safeParse(raw)
    if (!result.success) {
      const fields = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new Error(`Invalid plan from server: ${fields}`)
    }
    return result.data as AgentPlan
  }
}
