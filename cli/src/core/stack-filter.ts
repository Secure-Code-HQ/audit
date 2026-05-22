import type { StepDefinition, DetectedStack, CommandSpec } from './types'

const BINARY_REQUIRES_STACK: Record<string, keyof DetectedStack> = {
  'docker': 'docker',
  'podman': 'podman',
  'redis-cli': 'redis',
  'mongosh': 'mongodb',
  'mongo': 'mongodb',
  'psql': 'postgresql',
  'mysql': 'mysql',
}

function pipelineRequiresMissingStack(pipeline: CommandSpec[], stack: DetectedStack): boolean {
  const program = pipeline[0]?.program
  if (!program) return false
  const required = BINARY_REQUIRES_STACK[program]
  return !!required && !stack[required]
}

export function filterStepsByStack(steps: StepDefinition[], stack: DetectedStack): StepDefinition[] {
  return steps.filter(step => {
    const allPipelines = [step.pipeline, ...(step.fallbackPipelines ?? [])].filter(Boolean) as CommandSpec[][]
    if (allPipelines.length === 0) return true
    return !allPipelines.every(p => pipelineRequiresMissingStack(p, stack))
  })
}
