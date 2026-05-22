import type { IReportSender, SubmitResult } from '../../ports/report-sender'
import type { ILogger } from '../../ports/logger'
import type { AgentPayload } from '../../core/types'

export class HttpReportSender implements IReportSender {
  constructor(
    private baseUrl: string,
    private logger: ILogger,
  ) {}

  async submit(payload: AgentPayload, locale: string): Promise<SubmitResult> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30_000)
    const response = await globalThis.fetch(`${this.baseUrl}/api/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${payload.token}`,
        'Accept-Language': locale,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (response.status === 202) {
      return { success: true, statusCode: 202 }
    }

    let error = `Error HTTP ${response.status}`
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) error = body.error
    } catch {
      const text = await response.text()
      if (text) error = text
    }

    return { success: false, statusCode: response.status, error }
  }
}
