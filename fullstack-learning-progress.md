# Lộ trình và tiến độ học Fullstack 2026

> Cập nhật gần nhất: 24/08/2026

## 1. Mục tiêu

Xuất phát điểm là Frontend Developer, đã có nền tảng React và TypeScript. Mục tiêu là xây dựng được một ứng dụng fullstack hoàn chỉnh bằng Node.js/TypeScript, hiểu cách thiết kế API, cơ sở dữ liệu, authentication, testing và deploy.

Project thực hành xuyên suốt: **Bookmark Manager**.

Phạm vi MVP:

- Đăng ký, đăng nhập và đăng xuất.
- Mỗi user chỉ được truy cập dữ liệu của mình.
- CRUD bookmark.
- CRUD tag.
- Gắn và gỡ nhiều tag cho bookmark.
- Tìm kiếm bookmark theo title hoặc note.
- Lọc bookmark theo tag.
- Phân trang danh sách bookmark.
- Validation và xử lý lỗi API.
- Kết nối frontend hiện tại với API thật.
- Testing, Docker và CI/CD cơ bản.

Chưa làm trong MVP:

- OAuth.
- Chia sẻ bookmark công khai.
- Redis.
- Microservices.
- Kubernetes.

## 2. Stack đã chọn

### Frontend

- React 19.
- TypeScript.
- Vite.
- TanStack Router.
- TanStack Query.
- TanStack Table.
- React Hook Form và Zod.
- shadcn/ui, Radix UI và Tailwind CSS.
- Zustand.

### Backend

- Node.js 22.
- Fastify.
- TypeScript.
- PostgreSQL 17 chạy bằng Docker Compose.
- Drizzle ORM và Drizzle Kit.
- Zod.

### Sẽ bổ sung

- Argon2 để hash mật khẩu.
- JWT và HttpOnly cookie cho authentication.
- Vitest cho testing.
- Docker và GitHub Actions cho build, test và deploy.

## 3. Kiến thức đã học

### Database và SQL

- Quan hệ `1-N`: foreign key nằm ở phía `N`.
- Quan hệ `N-N`: dùng bảng trung gian.
- Primary key và foreign key.
- Composite primary key.
- Composite unique constraint.
- `ON DELETE CASCADE` và hướng cascade.
- Các kiểu dữ liệu PostgreSQL cần thiết: `UUID`, `TEXT`, `BOOLEAN`, `TIMESTAMPTZ`, `INTEGER`, `NUMERIC`, `JSONB`.
- Các constraint: `NOT NULL`, `UNIQUE`, `PRIMARY KEY`, `DEFAULT`, `REFERENCES`.
- Các lệnh `INSERT`, `SELECT`, `UPDATE`, `DELETE`.
- `WHERE`, `AND`, `OR`, `ILIKE` và cách dùng dấu ngoặc để tránh sai logic hoặc rò rỉ dữ liệu.
- Sắp xếp và phân trang với `ORDER BY`, `LIMIT`, `OFFSET`.
- `INNER JOIN` và `LEFT JOIN`.
- Dùng bảng trung gian để truy vấn bookmark theo tag hoặc tag theo bookmark.
- `GROUP BY` và `ARRAY_AGG` để gom nhiều tag vào một bookmark.

### Database schema đã hoàn thành

```text
User 1 ── N Bookmark
User 1 ── N Tag
Bookmark N ── N Tag thông qua BookmarkTag
```

Các bảng đã tạo:

- `users`.
- `bookmarks`.
- `tags`.
- `bookmark_tags`.

Các quy tắc quan trọng:

- Email duy nhất trên toàn hệ thống.
- Một user không được lưu trùng URL.
- Một user không được tạo trùng tên tag.
- Một tag không được gắn hai lần vào cùng bookmark.
- Xóa user sẽ xóa bookmark và tag của user.
- Xóa bookmark hoặc tag sẽ xóa liên kết trong `bookmark_tags`.
- Xóa tag không xóa bookmark.

### Drizzle và migration

- Định nghĩa PostgreSQL schema bằng TypeScript.
- Ánh xạ camelCase trong TypeScript sang snake_case trong PostgreSQL.
- `db:generate` sinh migration SQL từ thay đổi schema.
- `db:migrate` áp dụng các migration chưa chạy vào database.
- Migration lưu lịch sử thay đổi cấu trúc database.
- Migration đã áp dụng và chia sẻ không nên bị chỉnh sửa; thay đổi mới phải tạo migration mới.
- Đã tạo và áp dụng migration cho bốn bảng của MVP.

### Fastify cơ bản

- Khởi tạo Fastify server với logger.
- Dùng biến môi trường đã được Zod kiểm tra.
- Tách `app.ts` và `server.ts` để hỗ trợ testing bằng `app.inject()` sau này.
- Tạo `/health` và `/health/db`.
- Dùng PostgreSQL connection pool.
- Đóng pool bằng hook `onClose`.
- Tổ chức route thành Fastify plugin với prefix `/api`.
- Validation bằng `safeParse()`.
- Dùng status code `200`, `201`, `204`, `400`, `404`, `409`, `500`, `503` đúng ngữ cảnh cơ bản.
- Nhận diện PostgreSQL error code `23505` khi vi phạm unique constraint.

### API đã hoàn thành

Tag API:

```http
POST   /api/tags
GET    /api/tags
PATCH  /api/tags/:id
DELETE /api/tags/:id
```

Bookmark API cơ bản:

```http
POST   /api/bookmarks
GET    /api/bookmarks
PATCH  /api/bookmarks/:id
DELETE /api/bookmarks/:id
```

Các API hiện kiểm tra ownership bằng header tạm thời:

```http
x-user-id: <UUID>
```

Đây chỉ là cơ chế học CRUD và **không an toàn cho production**, vì client có thể giả mạo header. Nó sẽ được thay bằng user ID lấy từ JWT đã xác thực.

## 4. Trạng thái hiện tại

Giai đoạn hiện tại: **hoàn thành nền tảng backend và CRUD cơ bản; chuẩn bị học Authentication**.

Đã hoàn thành:

- [x] Chọn Fastify và Drizzle.
- [x] Khởi tạo backend TypeScript độc lập trong `server/`.
- [x] Chạy PostgreSQL bằng Docker Compose.
- [x] Cấu hình và kiểm tra biến môi trường.
- [x] Kết nối Fastify với PostgreSQL.
- [x] Thiết kế bốn bảng và quan hệ.
- [x] Tạo và áp dụng Drizzle migrations.
- [x] Tách `app.ts` và `server.ts`.
- [x] Health check cho API và database.
- [x] CRUD Tag.
- [x] CRUD Bookmark cơ bản.
- [x] Kiểm tra TypeScript và build backend thành công.

Chưa hoàn thành:

- [ ] Authentication thật.
- [ ] Thay `x-user-id` bằng user lấy từ token.
- [ ] Gắn và gỡ tag cho bookmark.
- [ ] Trả bookmark kèm danh sách tag.
- [ ] Search, filter và pagination.
- [ ] Automated testing.
- [ ] Kết nối frontend với API.
- [ ] Docker hóa toàn bộ ứng dụng.
- [ ] CI/CD và deploy.

## 5. Lộ trình tiếp theo

### Giai đoạn 1: Authentication

Mục tiêu: không còn tin vào `x-user-id` do client tự gửi.

- [ ] Cài Argon2, Fastify JWT và Fastify Cookie.
- [ ] Tạo `POST /api/auth/register`.
- [ ] Chuẩn hóa và kiểm tra email.
- [ ] Hash mật khẩu trước khi lưu.
- [ ] Tạo `POST /api/auth/login`.
- [ ] Xác minh password hash.
- [ ] Tạo JWT có thời hạn.
- [ ] Lưu JWT trong `HttpOnly` cookie.
- [ ] Tạo authentication middleware.
- [ ] Tạo `GET /api/auth/me`.
- [ ] Tạo `POST /api/auth/logout`.
- [ ] Thay `x-user-id` trong Tag và Bookmark API bằng user ID từ token.
- [ ] Kiểm tra user A không thể đọc, sửa hoặc xóa dữ liệu user B.

### Giai đoạn 2: Hoàn thiện Bookmark và Tag

- [ ] `PUT /api/bookmarks/:bookmarkId/tags/:tagId` để gắn tag.
- [ ] `DELETE /api/bookmarks/:bookmarkId/tags/:tagId` để gỡ tag.
- [ ] Kiểm tra cả bookmark và tag thuộc user hiện tại.
- [ ] Dùng transaction khi một thao tác thay đổi nhiều bảng.
- [ ] Trả bookmark kèm danh sách tag.
- [ ] Tìm kiếm không phân biệt hoa thường theo `title` hoặc `note`.
- [ ] Lọc theo tag.
- [ ] Sắp xếp theo thời gian tạo.
- [ ] Phân trang bằng `page` và `pageSize`.
- [ ] Trả metadata gồm `page`, `pageSize`, `total` và `totalPages`.
- [ ] Bổ sung index sau khi xem query thực tế bằng `EXPLAIN`.

### Giai đoạn 3: Testing

- [ ] Cài và cấu hình Vitest.
- [ ] Test `/health` bằng `app.inject()`.
- [ ] Tạo database riêng cho test.
- [ ] Test đăng ký và đăng nhập.
- [ ] Test validation thất bại.
- [ ] Test duplicate email, URL và tag.
- [ ] Test ownership giữa hai user.
- [ ] Test cascade khi xóa user, bookmark hoặc tag.
- [ ] Test search, filter và pagination.
- [ ] Làm sạch dữ liệu giữa các test.

### Giai đoạn 4: Kết nối frontend

- [ ] Tạo Axios client và cấu hình gửi cookie.
- [ ] Tạo React Query hooks cho auth, bookmark và tag.
- [ ] Tạo màn đăng ký và đăng nhập thật.
- [ ] Tạo Bookmark feature theo cấu trúc feature hiện tại.
- [ ] Hiển thị danh sách bằng TanStack Table.
- [ ] Tạo form thêm và sửa bookmark.
- [ ] Tạo UI quản lý tag.
- [ ] Thêm search, filter và pagination đồng bộ với URL.
- [ ] Xử lý loading, empty, error và unauthorized states.
- [ ] Invalidate React Query cache sau mutation.

### Giai đoạn 5: Production và deploy

- [ ] Docker hóa Fastify API.
- [ ] Chạy frontend, API và PostgreSQL bằng Compose cho local.
- [ ] Tách cấu hình development, test và production.
- [ ] Chạy migration an toàn khi deploy.
- [ ] Cấu hình CORS, cookie, HTTPS và trusted proxy.
- [ ] Thêm GitHub Actions chạy typecheck, build và test.
- [ ] Deploy database và backend.
- [ ] Deploy frontend.
- [ ] Cấu hình logging và health check production.

### Giai đoạn 6: Mở rộng sau MVP

- [ ] Share bookmark bằng public link.
- [ ] Refresh token hoặc session rotation nếu cần.
- [ ] Full-text search PostgreSQL và index phù hợp.
- [ ] Redis chỉ khi có nhu cầu cache được đo đạc.
- [ ] Rate limiting và audit log.
- [ ] Theo dõi hiệu năng và lỗi production.

## 6. Bước học kế tiếp

Chủ đề tiếp theo: **Authentication với Argon2, JWT và HttpOnly cookie**.

Kết quả cần đạt:

```text
Register/Login
      ↓
JWT trong HttpOnly cookie
      ↓
Authentication middleware
      ↓
request.user.id
      ↓
Tag và Bookmark API không còn dùng x-user-id
```

Nguyên tắc bảo mật cần giữ:

- Không lưu mật khẩu thô.
- Không trả password hash về client.
- Không tin user ID do request body, params hoặc header tự khai báo.
- Mọi query tài nguyên cá nhân phải giới hạn bằng user đã xác thực.
- Không đưa secret vào Git.
- Không tiết lộ lỗi database nội bộ trong API response.
