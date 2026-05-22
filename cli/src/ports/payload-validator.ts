import type { AgentPayload } from '../core/types'

export interface IPayloadValidator {
  validate(raw: unknown): AgentPayload
}
