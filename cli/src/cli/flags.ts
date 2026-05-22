import type { AgentConfig, SupportedLocale } from '../core/types'
import { SUPPORTED_LOCALES } from '../core/types'
import { detectSystemLocale } from './locale'

const BASE_URL_DEFAULT = 'https://audit.securecodehq.com'
const AGENT_VERSION = '1.0.0'
const STEP_TIMEOUT_MS = 10_000
const PHASE2_TIMEOUT_MS = 5 * 60 * 1000

const args = process.argv.slice(2)

export function getFlag(name: string): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith(`${name}=`)) return arg.slice(name.length + 1)
    if (arg === name && i + 1 < args.length) return args[i + 1]
  }
  return undefined
}

export function getPositionalArg(index: number): string | undefined {
  const positional = args.filter(a => !a.startsWith('--'))
  return positional[index]
}

export function hasFlag(name: string): boolean {
  return args.includes(name)
}

export function parseConfig(locale: SupportedLocale): AgentConfig {
  const token = getFlag('--token') || getPositionalArg(0) || ''
  const baseUrl = getFlag('--base-url') || process.env.AGENT_BASE_URL || BASE_URL_DEFAULT

  return {
    token,
    dryRun: hasFlag('--dry-run'),
    debug: hasFlag('--debug'),
    baseUrl,
    locale,
    agentVersion: AGENT_VERSION,
    stepTimeoutMs: STEP_TIMEOUT_MS,
    phase2TimeoutMs: PHASE2_TIMEOUT_MS,
  }
}

export function parseLangFlag(): SupportedLocale {
  const lang = getFlag('--lang')
  if (lang && SUPPORTED_LOCALES.includes(lang as SupportedLocale)) {
    return lang as SupportedLocale
  }
  return detectSystemLocale()
}
