import type { IEnvDetector } from '../../ports/env-detector'
import type { ICommandRunner } from '../../ports/command-runner'
import type { ILogger } from '../../ports/logger'
import type { DetectedEnvironment } from '../../core/types'
import { detectStack } from './stack-detector'

const STEP_TIMEOUT_MS = 10_000

export class ShellEnvDetector implements IEnvDetector {
  constructor(
    private runner: ICommandRunner,
    private logger: ILogger,
  ) {}

  async detect(): Promise<DetectedEnvironment> {
    const [unameA, unameR, uptimeRaw, publicIp, stack] = await Promise.allSettled([
      this.tryGet('uname', ['-a']),
      this.tryGet('uname', ['-r']),
      this.tryGet('cat', ['/proc/uptime']),
      this.getPublicIp(),
      detectStack(this.runner),
    ])

    const unameStr = unameA.status === 'fulfilled' ? (unameA.value ?? '') : ''
    const kernelStr = unameR.status === 'fulfilled' ? (unameR.value ?? '') : ''

    let osStr = ''
    const lsbRelease = await this.tryGet('lsb_release', ['-d'])
    if (lsbRelease) {
      osStr = lsbRelease.replace(/^Description:\s*/i, '').trim()
    } else {
      osStr = unameStr
    }

    let uptimeDays = 0
    if (uptimeRaw.status === 'fulfilled' && uptimeRaw.value) {
      const seconds = parseFloat(uptimeRaw.value.split(' ')[0])
      if (!isNaN(seconds)) uptimeDays = Math.floor(seconds / 86400)
    }

    const ip = publicIp.status === 'fulfilled' ? publicIp.value : null
    const detectedStack = stack.status === 'fulfilled' ? stack.value : {}

    return {
      os: osStr || unameStr,
      kernel: kernelStr,
      uptime_days: uptimeDays,
      public_ip: ip,
      detected_stack: detectedStack,
    }
  }

  private async tryGet(program: string, args: string[]): Promise<string | null> {
    try {
      const result = await this.runner.runCommand(program, args, STEP_TIMEOUT_MS)
      return result || null
    } catch {
      return null
    }
  }

  private async getPublicIp(): Promise<string | null> {
    try {
      const ip = await this.runner.runCommand('curl', ['-s', '--max-time', '5', 'https://ifconfig.me'], 8000)
      if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip
    } catch {
      this.logger.emit({ type: 'debug', message: 'ifconfig.me failed, trying api.ipify.org' })
    }
    try {
      const ip = await this.runner.runCommand('curl', ['-s', '--max-time', '5', 'https://api.ipify.org'], 8000)
      if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip
    } catch {
      this.logger.emit({ type: 'debug', message: 'api.ipify.org also failed' })
    }
    return null
  }
}
