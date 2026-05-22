import { execFile as execFileCb, spawn } from 'child_process'
import { promisify } from 'util'
import type { ICommandRunner } from '../../ports/command-runner'
import type { ILogger } from '../../ports/logger'
import type { CommandSpec } from '../../core/types'

const execFilePromise = promisify(execFileCb)

export class ExecCommandRunner implements ICommandRunner {
  constructor(private logger: ILogger) {}

  async runCommand(program: string, args: string[], timeoutMs: number): Promise<string> {
    this.logger.emit({ type: 'debug', message: `Running: ${program} [${args.length} args]` })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const { stdout, stderr } = await execFilePromise(program, args, {
        signal: controller.signal,
        timeout: timeoutMs,
      })
      const out = stdout.trim()
      if (out) return out
      return stderr.trim()
    } finally {
      clearTimeout(timer)
    }
  }

  async runPipeline(pipeline: CommandSpec[], timeoutMs: number): Promise<string> {
    this.logger.emit({
      type: 'debug',
      message: `Running pipeline: ${pipeline.map(c => c.program).join(' | ')} [${pipeline.length} stages]`,
    })

    if (pipeline.length === 1) {
      return this.runSingle(pipeline[0], timeoutMs)
    }

    return this.runChain(pipeline, timeoutMs)
  }

  private async runSingle(cmd: CommandSpec, timeoutMs: number): Promise<string> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const { stdout, stderr } = await execFilePromise(cmd.program, cmd.args, {
        signal: controller.signal,
        timeout: timeoutMs,
      })
      const out = stdout.trim()
      if (out) return out
      return stderr.trim()
    } catch (err) {
      if (err instanceof Error) {
        const e = err as Error & { code?: number; stdout?: string; stderr?: string }
        if (e.stdout && e.stdout.trim()) return e.stdout.trim()
        e.stderr = ''
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }

  private runChain(pipeline: CommandSpec[], timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false
      const finish = (fn: (v: any) => void, val: unknown) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        procs.forEach(p => { try { p.kill() } catch {} })
        fn(val)
      }

      const procs = pipeline.map((cmd, i) => {
        const isFirst = i === 0
        return spawn(cmd.program, cmd.args, {
          stdio: [isFirst ? 'ignore' : 'pipe', 'pipe', 'ignore'],
        })
      })

      for (let i = 0; i < procs.length - 1; i++) {
        procs[i].stdout!.pipe(procs[i + 1].stdin!)
        procs[i].on('error', err => finish(reject, err))
      }

      let output = ''
      const last = procs[procs.length - 1]
      last.stdout!.on('data', (chunk: Buffer) => { output += chunk.toString() })
      last.on('error', err => finish(reject, err))
      last.on('close', code => {
        if (code === 0 || output.trim().length > 0) {
          finish(resolve, output.trim())
        } else {
          const err = new Error(`Pipeline failed with exit code ${code}`) as Error & { code: number; stderr: string }
          err.code = code ?? 1
          err.stderr = ''
          finish(reject, err)
        }
      })

      const timer = setTimeout(() => {
        finish(reject, new Error('Pipeline timeout'))
      }, timeoutMs)
    })
  }
}
