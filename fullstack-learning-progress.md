# Lộ trình và tiến độ học Fullstack 2026

> Cập nhật gần nhất: 25/08/2026

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

Giai đoạn hiện tại: **hoàn thành Giai đoạn 1-4; chuẩn bị học Giai đoạn 5 (Production & Deploy)**.

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

Đã hoàn thành thêm (Giai đoạn 1 - Authentication):

- [x] Cài Argon2, Fastify JWT và Fastify Cookie.
- [x] `POST /api/auth/register` — hash password, tạo user, tự động đăng nhập.
- [x] `POST /api/auth/login` — verify password, không tiết lộ email.
- [x] JWT lưu trong `HttpOnly` cookie, `path: '/'`.
- [x] Authentication middleware `app.authenticate`.
- [x] `GET /api/auth/me` và `POST /api/auth/logout`.
- [x] Thay `x-user-id` bằng `request.user.userId`.
- [x] Module augmentation cho Fastify + JWT types.

Đã hoàn thành thêm (Giai đoạn 2 - Hoàn thiện Bookmark & Tag):

- [x] `PUT /api/bookmarks/:bookmarkId/tags/:tagId` để gắn tag (dùng transaction).
- [x] `DELETE /api/bookmarks/:bookmarkId/tags/:tagId` để gỡ tag (dùng subquery).
- [x] Trả bookmark kèm danh sách tag (2 SELECT + JS map).
- [x] Search không phân biệt hoa thường (title, note).
- [x] Lọc theo tag (`EXISTS` subquery).
- [x] Sắp xếp theo `createdAt DESC`.
- [x] Phân trang (`page`, `pageSize`, metadata `total`, `totalPages`).
- [x] EXPLAIN ANALYZE — không cần thêm index (Postgres tối ưu đúng).

Đã hoàn thành thêm (Giai đoạn 3 - Testing):

- [x] Cài và cấu hình Vitest.
- [x] Test `/health` endpoint.
- [x] Tạo database test riêng (`bookmark_manager_test`).
- [x] Test register/login (valid, invalid, duplicate email, wrong password).
- [x] Test security: không tiết lộ email exists vs sai password.
- [x] Setup cleanup dữ liệu giữa test (beforeEach).

Đã hoàn thành thêm (Giai đoạn 4 - Kết nối Frontend):

- [x] Axios client + cookie config.
- [x] React Query hooks (auth, bookmark, tag).
- [x] Frontend auth flow (register, login, logout).
- [x] Bookmark UI (CRUD, search, filter, pagination).
- [x] Tag management (attach, detach).
- [x] Loading/error states + invalidate cache.

Chưa hoàn thành:

- [ ] Docker hóa toàn bộ ứng dụng.
- [ ] CI/CD (GitHub Actions).
- [ ] Deploy production.
- [ ] Hoàn thiện test CRUD bookmark, ownership, cascade.
- [ ] Mở rộng features (share, full-text search, Redis).

## 5. Lộ trình tiếp theo

### Giai đoạn 1: Authentication — Hoàn thành

Mục tiêu: không còn tin vào `x-user-id` do client tự gửi.

- [x] Cài Argon2, Fastify JWT và Fastify Cookie.
- [x] Tạo `POST /api/auth/register`.
- [x] Chuẩn hóa và kiểm tra email.
- [x] Hash mật khẩu trước khi lưu.
- [x] Tạo `POST /api/auth/login`.
- [x] Xác minh password hash.
- [x] Tạo JWT có thời hạn.
- [x] Lưu JWT trong `HttpOnly` cookie.
- [x] Tạo authentication middleware.
- [x] Tạo `GET /api/auth/me`.
- [x] Tạo `POST /api/auth/logout`.
- [x] Thay `x-user-id` trong Tag và Bookmark API bằng user ID từ token.
- [x] Kiểm tra user A không thể đọc, sửa hoặc xóa dữ liệu user B.

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

Chủ đề tiếp theo: **Giai đoạn 5 — Production & Deploy** (Docker, compose, CI/CD, deploy backend/frontend).

Nguyên tắc bảo mật đang giữ:

- Không lưu mật khẩu thô.
- Không trả password hash về client.
- Không tin user ID do request body, params hoặc header tự khai báo.
- Mọi query tài nguyên cá nhân phải giới hạn bằng user đã xác thực.
- Không đưa secret vào Git.
- Không tiết lộ lỗi database nội bộ trong API response.

### Bài học rút ra từ Giai đoạn 1

- Cookie không set `path` sẽ mặc định scope theo thư mục của URL lúc set (vd: set ở `/api/auth/login` → cookie chỉ áp dụng cho `/api/auth/*`), không phải toàn site. Luôn set `path: '/'` tường minh khi cookie cần dùng ở nhiều route.
- TypeScript không tự biết type của `app.decorate(...)` hay payload JWT — cần module augmentation (`declare module 'fastify'`, `declare module '@fastify/jwt'`) trong file `.d.ts` riêng.
- Không tiết lộ khác biệt giữa "email không tồn tại" và "sai mật khẩu" trong response login — tránh user enumeration.
