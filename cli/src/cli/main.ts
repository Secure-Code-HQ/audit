import { parseConfig, parseLangFlag, getFlag, hasFlag } from './flags'
import { confirmLocale, getMessages } from './locale'
import { runAuditUseCase } from '../core/run-audit'
import { ExecCommandRunner } from '../adapters/shell/exec-command-runner'
import { ShellEnvDetector } from '../adapters/shell/shell-env-detector'
import { HttpPlanProvider } from '../adapters/http/http-plan-provider'
import { HttpReportSender } from '../adapters/http/http-report-sender'
import { ZodPlanValidator } from '../adapters/validation/zod-plan-validator'
import { ZodPayloadValidator } from '../adapters/validation/zod-payload-validator'
import { FileCleanup } from '../adapters/system/file-cleanup'
import { ConsoleLogger } from '../adapters/console/console-logger'

const cleanup = new FileCleanup(__filename)

async function main(): Promise<void> {
  let detectedLocale = parseLangFlag()
  if (!getFlag('--lang')) {
    detectedLocale = await confirmLocale(detectedLocale)
  }

  const config = parseConfig(detectedLocale)

  if (!config.token) {
    process.stderr.write('Error: Token is required. Use --token=<token> or pass it as first argument.\n')
    process.exit(1)
  }

  const logger = new ConsoleLogger(config.debug, config.locale)
  const commandRunner = new ExecCommandRunner(logger)
  const envDetector = new ShellEnvDetector(commandRunner, logger)
  const planProvider = new HttpPlanProvider(config.baseUrl, logger)
  const reportSender = new HttpReportSender(config.baseUrl, logger)
  const planValidator = new ZodPlanValidator()
  const payloadValidator = new ZodPayloadValidator()

  await runAuditUseCase({
    config,
    planProvider,
    envDetector,
    commandRunner,
    reportSender,
    planValidator,
    payloadValidator,
    logger,
  })
}

main()
  .catch(err => {
    const debug = hasFlag('--debug')
    const msgs = getMessages(parseLangFlag())
    process.stderr.write(`${msgs.errUnexpected}${err instanceof Error ? err.message : String(err)}\n`)
    if (debug && err instanceof Error) process.stderr.write((err.stack ?? '') + '\n')
    process.exit(1)
  })
  .finally(() => cleanup.execute())
