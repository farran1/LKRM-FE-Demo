import { Moment } from 'moment'
import { ReadonlyURLSearchParams } from 'next/navigation'

export default function convertSearchParams(searchParams: ReadonlyURLSearchParams) {
  const paramsObj: Record<string, any> = {}
  searchParams.forEach((value: string, key: string) => {
    if (!value) return

    const parsedValue = parseValue(value)

    if (paramsObj[key]) {
      // If already exists, convert to array
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

function parseValue(value: string): any {
  if (value === '') return null
  if (value === 'true') return true
  if (value === 'false') return false
  if (!isNaN(Number(value))) return Number(value)
  return value
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

export function downloadURI(uri: string, name: string) {
  let link: HTMLAnchorElement | null = document.createElement('a')

  link.download = name
  link.href = uri

  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  link = null
}