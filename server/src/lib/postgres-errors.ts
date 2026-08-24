export function hasPostgresErrorCode(
  error: unknown,
  expectedCode: string
) {
  let currentError: unknown = error

  while (typeof currentError === 'object' && currentError !== null) {
    if ('code' in currentError && currentError.code === expectedCode) {
      return true
    }

    if (!('cause' in currentError)) {
      return false
    }

    currentError = currentError.cause
  }

  return false
}
