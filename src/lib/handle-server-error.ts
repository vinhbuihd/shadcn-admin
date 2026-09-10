import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { getRetryAfterSeconds, getServerFieldErrors } from '@/lib/server-errors'

function formatRetryAfter(seconds: number) {
  if (seconds < 60) return `${seconds} seconds`

  const minutes = Math.ceil(seconds / 60)
  return minutes === 1 ? '1 minute' : `${minutes} minutes`
}

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Content not found.'
  }

  if (error instanceof AxiosError) {
    // Lỗi theo field đã được form hiển thị ngay dưới ô nhập, nên toast chỉ trỏ
    // tới đó thay vì lặp lại nội dung.
    if (getServerFieldErrors(error).length > 0) {
      toast.error('Please check the highlighted fields.')
      return
    }

    if (error.response?.status === 429) {
      const seconds = getRetryAfterSeconds(error)

      toast.error(
        seconds
          ? `Too many attempts. Try again in ${formatRetryAfter(seconds)}.`
          : 'Too many attempts. Please try again later.'
      )
      return
    }

    errMsg = error.response?.data?.message ?? errMsg
  }

  toast.error(errMsg)
}
