import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError, BadRequestError } from './errors.js'
import { findPostgresError } from './postgres-errors.js'

/**
 * Tên constraint trong migration → thông báo cho client.
 *
 * Nhờ đọc `error.constraint` mà một chỗ duy nhất xử lý được mọi vi phạm unique,
 * thay vì mỗi route tự đoán "23505 ở đây chắc là trùng email".
 */
const uniqueViolationMessages: Record<string, string> = {
  users_email_unique: 'Email already exists',
  bookmarks_user_url_unique: 'Bookmark already exists',
  tags_user_name_unique: 'Tag already exists',
  bookmark_tags_bookmark_id_tag_id_pk: 'Bookmark tag already exists',
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // 1. Lỗi validation: kèm chi tiết field nào sai
  if (error instanceof BadRequestError) {
    return reply.code(error.statusCode).send({
      message: error.message,
      errors: error.details,
    })
  }

  // 2. Lỗi nghiệp vụ khác: 401, 404, 409...
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({ message: error.message })
  }

  // 3. Vi phạm unique constraint bốc lên từ Postgres
  const uniqueViolation = findPostgresError(error, '23505')
  if (uniqueViolation) {
    const constraint = uniqueViolation.constraint
    return reply.code(409).send({
      message:
        (constraint && uniqueViolationMessages[constraint]) || 'Resource already exists',
    })
  }

  // 4. Lỗi do Fastify hoặc plugin sinh ra, đã mang sẵn statusCode:
  //    429 của rate limit, 400 khi JSON hỏng, 415 sai content-type...
  if (typeof error.statusCode === 'number' && error.statusCode < 500) {
    return reply.code(error.statusCode).send({ message: error.message })
  }

  // 5. Còn lại là lỗi hệ thống: ghi log đầy đủ, nhưng không lộ chi tiết ra ngoài
  request.log.error(error)
  return reply.code(500).send({ message: 'Internal server error' })
}
