// DEV-ONLY: Restored exports for convertSearchParams, convertDateTime, and formatPayload for compatibility with existing imports. Remove if not needed.
import { z, ZodError } from 'zod'
import { Moment } from 'moment'
import { ReadonlyURLSearchParams } from 'next/navigation'

export default function convertSearchParams(searchParams: ReadonlyURLSearchParams) {
  const paramsObj: Record<string, any> = {}
  searchParams.forEach((value: string, key: string) => {
    if (!value) return
    const parsedValue = parseValue(value)
    if (paramsObj[key]) {
      if (Array.isArray(paramsObj[key])) {
        paramsObj[key].push(parsedValue)
      } else {
        paramsObj[key] = [paramsObj[key], parsedValue]
      }
    } else {
      paramsObj[key] = parsedValue
    }
  })
  return paramsObj
}

function parseValue(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export const convertDateTime = (date: Moment, time: Moment) => {
  const merged = date
    .hour(time.hour())
    .minute(time.minute())
    .second(time.second())
    .millisecond(time.millisecond());
  return merged.toISOString()
}

export const formatPayload = (payload: Record<string, any>) => {
  let result: Record<string, any> = {}
  for(let key in payload) {
    if (!payload[key]) continue
    result[key] = payload[key]
  }
  return result
}

export function formatError(error: ZodError) {
  let result: any = {}
  // @ts-ignore
  const fields = z.treeifyError(error).properties
  for (let key in fields) {
    result[key] = fields[key].errors
  }
  return result
}