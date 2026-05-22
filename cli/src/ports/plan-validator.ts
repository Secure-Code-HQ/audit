import type { AgentPlan } from '../core/types'

export interface IPlanValidator {
  validate(raw: unknown): AgentPlan
}
