import * as readline from 'readline'
import type { SupportedLocale } from '../core/types'
import { SUPPORTED_LOCALES } from '../core/types'

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  es: 'Español',
  en: 'English',
}

export function detectSystemLocale(): SupportedLocale {
  const langEnv = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || ''
  const code = langEnv.split(/[_.]/)[0]?.toLowerCase()
  if (code && SUPPORTED_LOCALES.includes(code as SupportedLocale)) return code as SupportedLocale
  return 'en'
}

export async function confirmLocale(detected: SupportedLocale): Promise<SupportedLocale> {
  if (!process.stdin.isTTY) return detected

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const options = SUPPORTED_LOCALES.map(l => l === detected ? `[${l}]` : l).join('/')

  return new Promise((resolve) => {
    rl.question(`  Report language? (${LOCALE_NAMES[detected]}) ${options}: `, (answer) => {
      rl.close()
      const trimmed = answer.trim().toLowerCase()
      if (!trimmed) return resolve(detected)
      if (SUPPORTED_LOCALES.includes(trimmed as SupportedLocale)) return resolve(trimmed as SupportedLocale)
      resolve(detected)
    })
  })
}

type MsgStrings = {
  fetchPlan: string
  detecting: string
  running: (n: number) => string
  validating: string
  sending: string
  dryRun: string
  done: string
  doneHint: string
  errPlan: string
  errNet: string
  errEnv: string
  errContract: string
  errSubmit: string
  errSubmitHint: string
  errUnexpected: string
}

export function getMessages(locale: SupportedLocale): MsgStrings {
  if (locale === 'es') {
    return {
      fetchPlan: 'Obteniendo plan de auditoría...',
      detecting: 'Detectando entorno...',
      running: (n: number) => `Ejecutando ${n} checks...`,
      validating: 'Validando contrato...',
      sending: 'Enviando resultados...',
      dryRun: 'Dry run completado. No se han enviado datos.',
      done: 'Auditoría completada.',
      doneHint: 'Recibirás el informe en tu dashboard en los próximos minutos.',
      errPlan: 'No se pudo obtener el plan de auditoría',
      errNet: 'Error de red al obtener el plan',
      errEnv: 'Error detectando el entorno',
      errContract: 'Errores de validación del contrato:',
      errSubmit: 'Error de red al enviar el informe: ',
      errSubmitHint: 'No se pudo contactar con el servidor. Comprueba tu conexión a internet.',
      errUnexpected: 'Error inesperado: ',
    }
  }
  return {
    fetchPlan: 'Fetching audit plan...',
    detecting: 'Detecting environment...',
    running: (n: number) => `Running ${n} checks...`,
    validating: 'Validating contract...',
    sending: 'Sending results...',
    dryRun: 'Dry run completed. No data was sent.',
    done: 'Audit completed.',
    doneHint: 'You will receive the report in your dashboard shortly.',
    errPlan: 'Could not fetch audit plan',
    errNet: 'Network error fetching plan',
    errEnv: 'Error detecting environment',
    errContract: 'Contract validation errors:',
    errSubmit: 'Network error submitting report: ',
    errSubmitHint: 'Could not reach the server. Check your internet connection.',
    errUnexpected: 'Unexpected error: ',
  }
}
