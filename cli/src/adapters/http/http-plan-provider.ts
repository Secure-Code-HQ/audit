import type { IPlanProvider } from '../../ports/plan-provider'
import type { ILogger } from '../../ports/logger'
import type { AgentPlan } from '../../core/types'

export class HttpPlanProvider implements IPlanProvider {
  constructor(
    private baseUrl: string,
    private logger: ILogger,
  ) {}

  async fetch(token: string): Promise<AgentPlan> {
    const url = `${this.baseUrl}/api/v1/plans/server`
    this.logger.emit({ type: 'debug', message: `Fetching plan from: ${url}` })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30_000)
    const response = await globalThis.fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`HTTP ${response.status}: ${body}`)
    }

    const plan = (await response.json()) as AgentPlan
    this.logger.emit({
      type: 'debug',
      message: `Plan received: ${plan.plan_id} v${plan.plan_version}, ${plan.steps.length} steps`,
    })
    return plan
  }
}
