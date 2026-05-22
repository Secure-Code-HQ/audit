import type { CommandSpec } from '../core/types'

export interface ICommandRunner {
  runCommand(program: string, args: string[], timeoutMs: number): Promise<string>
  runPipeline(pipeline: CommandSpec[], timeoutMs: number): Promise<string>
}
