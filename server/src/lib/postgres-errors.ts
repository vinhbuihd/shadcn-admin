type PostgresError = {
  code: string
  /** Tên constraint bị vi phạm, ví dụ `users_email_unique`. */
  constraint?: string
}

/**
 * Drizzle bọc lỗi của `pg` lại, nên lỗi thật nằm trong chuỗi `cause` chứ không phải
 * ở tầng ngoài cùng. Hàm này đi dọc chuỗi đó để lấy ra đúng lỗi Postgres cần tìm.
 */
export function findPostgresError(
  error: unknown,
  expectedCode: string
): PostgresError | undefined {
  let currentError: unknown = error

  while (typeof currentError === 'object' && currentError !== null) {
    if ('code' in currentError && currentError.code === expectedCode) {
      return currentError as PostgresError
    }

    if (!('cause' in currentError)) {
      return undefined
    }

    currentError = currentError.cause
  }

  return undefined
}

export function hasPostgresErrorCode(error: unknown, expectedCode: string) {
  return findPostgresError(error, expectedCode) !== undefined
}
