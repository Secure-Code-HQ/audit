import type { AgentPayload } from '../core/types'

export interface SubmitResult {
  success: boolean
  statusCode: number
  error?: string
}

export interface IReportSender {
  submit(payload: AgentPayload, locale: string): Promise<SubmitResult>
}
