import type { AgentPlan } from '../core/types'

export interface IPlanProvider {
  fetch(token: string): Promise<AgentPlan>
}
