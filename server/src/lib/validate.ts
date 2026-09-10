import type { z } from 'zod'
import { BadRequestError } from './errors.js'

/**
 * Validate rồi trả về dữ liệu đã parse, sai thì ném `BadRequestError` kèm chi tiết
 * từng field. Trước đây mọi route đều trả `{ message: 'Invalid request' }` — đúng
 * status code nhưng client không biết field nào hỏng.
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new BadRequestError(
      'Invalid request',
      result.error.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      }))
    )
  }

  return result.data
}
