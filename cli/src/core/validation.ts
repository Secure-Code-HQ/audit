import type { AuditContract, PreflightResult } from './types'

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function setNestedField(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  if (parts.some(p => FORBIDDEN_KEYS.has(p))) return
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  }
  current[parts[parts.length - 1]] = value
}

function deleteNestedField(obj: Record<string, unknown>, path: string): void {
  const parts = path.split('.')
  let current: Record<string, unknown> = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof current[parts[i]] !== 'object' || current[parts[i]] === null) return
    current = current[parts[i]] as Record<string, unknown>
  }
  delete current[parts[parts.length - 1]]
}

export function getNestedField(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

const SENSITIVE_PATTERNS = [
  /password/i, /passwd/i, /secret/i,
  /private.?key/i, /api.?key/i,
  /credential/i,
]

function scanForSensitiveKeys(obj: unknown, path: string, found: string[]): void {
  if (typeof obj !== 'object' || obj === null) return
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const fullPath = path ? `${path}.${key}` : key
    if (SENSITIVE_PATTERNS.some(p => p.test(key)) && val !== undefined && val !== null && val !== '') {
      found.push(fullPath)
    }
    if (typeof val === 'object' && val !== null) {
      scanForSensitiveKeys(val, fullPath, found)
    }
  }
}

export function validatePreflight(
  results: Record<string, unknown>,
  contract: AuditContract,
): PreflightResult {
  const errors: string[] = []
  const required = contract.required ?? []

  for (const fieldPath of required) {
    const value = getNestedField(results, fieldPath)
    if (value === undefined || value === null) {
      errors.push(`Missing required field: ${fieldPath}`)
    }
  }

  const sensitiveKeys: string[] = []
  scanForSensitiveKeys(results, '', sensitiveKeys)
  const allowedSensitive = new Set([ ...(contract.required ?? []), ...(contract.optional ?? []) ])
  for (const key of sensitiveKeys) {
    if (!allowedSensitive.has(key)) {
      deleteNestedField(results, key)
      errors.push(`Sensitive field detected and stripped: ${key}`)
    }
  }

  return { valid: errors.length === 0, errors }
}
