/**
 * Lỗi nghiệp vụ: thứ route chủ động ném ra khi biết chính xác chuyện gì sai và
 * client cần thấy gì. Khác hẳn lỗi hệ thống (mất kết nối DB, bug) — loại đó không
 * có `statusCode`, sẽ rơi xuống nhánh 500 và được ghi log.
 */
export class AppError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = new.target.name
    this.statusCode = statusCode
  }
}

export class BadRequestError extends AppError {
  readonly details?: unknown

  constructor(message = 'Invalid request', details?: unknown) {
    super(message, 400)
    this.details = details
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409)
  }
}
