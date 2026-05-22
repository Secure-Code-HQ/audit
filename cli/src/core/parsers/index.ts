import { parseBoolean } from './boolean'
import { parseNumber } from './number'
import { parseJson } from './json'
import { parseLines } from './lines'
import { parseString } from './string'
import { parseExitSuccess } from './exitcode'

export function parseStepOutput(rawOutput: string, parser?: string): unknown {
  if (!parser) return rawOutput

  const p = parser.toLowerCase()

  if (p === 'boolean' || p === 'bool') return parseBoolean(rawOutput)
  if (p === 'number' || p === 'integer' || p === 'int') return parseNumber(rawOutput)
  if (p === 'json') return parseJson(rawOutput)
  if (p === 'lines' || p === 'array') return parseLines(rawOutput)
  if (p === 'trim' || p === 'string') return parseString(rawOutput)
  if (p === 'exitcode') return parseExitSuccess(rawOutput)

  return rawOutput.trim()
}
