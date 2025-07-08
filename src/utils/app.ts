import { z, ZodError } from 'zod/v4'

export function formatError(error: ZodError) {
  let result: any = {}

  // @ts-ignore
  const fields = z.treeifyError(error).properties
  for (let key in fields) {
    result[key] = fields[key].errors
  }
  return result
}