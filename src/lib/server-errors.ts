import { AxiosError } from 'axios'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'

/**
 * API trả lỗi validation theo từng field:
 *   { message: 'Invalid request', errors: [{ field: 'url', message: 'Invalid url' }] }
 * Trước đây frontend chỉ đọc `message` nên người dùng không biết ô nào sai.
 */
export type ServerFieldError = {
  field: string
  message: string
}

export function getServerFieldErrors(error: unknown): ServerFieldError[] {
  if (!(error instanceof AxiosError)) return []

  const errors = error.response?.data?.errors
  if (!Array.isArray(errors)) return []

  return errors.filter(
    (issue): issue is ServerFieldError =>
      !!issue &&
      typeof issue.field === 'string' &&
      typeof issue.message === 'string'
  )
}

/** Số giây phải chờ khi bị rate limit, lấy từ header `retry-after`. */
export function getRetryAfterSeconds(error: unknown): number | null {
  if (!(error instanceof AxiosError)) return null

  const retryAfter = error.response?.headers?.['retry-after']
  const seconds = Number(retryAfter)

  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null
}

type ApplyServerErrorsOptions<T extends FieldValues> = {
  /**
   * Field sẽ nhận lỗi 409 (dữ liệu đã tồn tại). Server chỉ trả `message` chứ không
   * nói field nào, vì nó biết constraint chứ không biết form của bạn có ô nào —
   * nên phía form tự chỉ định.
   */
  conflictField?: Path<T>
}

/**
 * Gắn lỗi từ server vào đúng ô nhập của react-hook-form.
 *
 * Field nào server trả về mà form không có thì bỏ qua: form và API không bắt buộc
 * trùng tên field, và không nên vì thế mà vỡ.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  form: UseFormReturn<T>,
  options: ApplyServerErrorsOptions<T> = {}
) {
  const fieldErrors = getServerFieldErrors(error)

  if (fieldErrors.length > 0) {
    const formFields = form.getValues()

    for (const { field, message } of fieldErrors) {
      if (field in formFields) {
        form.setError(field as Path<T>, { type: 'server', message })
      }
    }

    return
  }

  if (
    options.conflictField &&
    error instanceof AxiosError &&
    error.response?.status === 409
  ) {
    form.setError(options.conflictField, {
      type: 'server',
      message: error.response.data?.message ?? 'Already exists.',
    })
  }
}
