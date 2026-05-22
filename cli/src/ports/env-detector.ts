import type { DetectedEnvironment } from '../core/types'

export interface IEnvDetector {
  detect(): Promise<DetectedEnvironment>
}
