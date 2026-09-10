# Lộ trình và tiến độ học Fullstack 2026

> Cập nhật gần nhất: 10/09/2026

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

Giai đoạn hiện tại: **hoàn thành Giai đoạn 1-5 (Production & Deploy); app đã chạy thật trên Neon + Render + Vercel**.

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

Đã hoàn thành thêm (Giai đoạn 5 - Production & Deploy):

- [x] Docker hóa Fastify API (`server/Dockerfile`).
- [x] Docker Compose chạy frontend + API + PostgreSQL cho local.
- [x] Cấu hình CORS (`@fastify/cors`).
- [x] GitHub Actions: job frontend (lint, format check, build) + job backend (typecheck, build, migrate, test với Postgres service container).
- [x] Deploy database: Neon (Postgres 17), migration chạy thành công.
- [x] Deploy backend: Render (Docker, root directory `server/`), `/health` và `/health/db` xác nhận kết nối Neon ok.
- [x] Deploy frontend: Vercel, dùng `vercel.json` rewrite `/api/*` sang Render — tránh luôn vấn đề cookie `sameSite: 'lax'` bị chặn cross-site vì browser chỉ thấy same-origin.
- [x] Full flow đăng ký/đăng nhập/tạo bookmark test ok trên production thật.
- [x] Tách logger theo môi trường (`server/src/config/logger.ts`): `development` dùng `pino-pretty`, `test` tắt hẳn, `production` JSON level `info`.
- [x] Migration an toàn khi deploy: Render Free tier không có Pre-Deploy Command (tính năng trả phí) → chuyển sang chạy `yarn db:migrate` ngay trong `CMD` của `server/Dockerfile` trước khi start server (idempotent, an toàn chạy lại mỗi lần container khởi động/wake).

**Giai đoạn 5 hoàn thành 100%.**

Đã hoàn thành thêm (Củng cố - Test isolation):

- [x] `resolveDatabaseUrl()` trong `server/src/config/env.ts`: khi `NODE_ENV=test` thì bắt buộc dùng `DATABASE_URL_TEST`.
- [x] Throw khi thiếu `DATABASE_URL_TEST`, và throw khi nó trùng `DATABASE_URL` — không fallback âm thầm.
- [x] `src/test/setup.ts` (code chết, không nơi nào import) đổi thành `src/test/global-setup.ts`, khai báo trong `vitest.config.ts`, tự chạy migration lên database test.
- [x] `yarn db:create-test` tạo database test, idempotent (bỏ qua lỗi `42P04 duplicate_database`).
- [x] CI: thêm `DATABASE_URL_TEST` riêng, thêm bước tạo database test, đổi `yarn test` thành `yarn test:run` để không rơi vào watch mode.
- [x] `.env.example` bổ sung `DATABASE_URL_TEST`, `NODE_ENV`, `FRONTEND_URL`.

Chưa hoàn thành:

- [x] Test ownership và cascade: `ownership.test.ts` (14 case) + `cascade.test.ts` (4 case). Toàn bộ 31 test xanh ngày 10/09/2026.
- [ ] Test happy path còn thiếu: CRUD bookmark, search, filter, pagination.
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

- [x] Docker hóa Fastify API.
- [x] Chạy frontend, API và PostgreSQL bằng Compose cho local.
- [ ] Tách cấu hình development, test và production.
- [ ] Chạy migration an toàn khi deploy.
- [x] Cấu hình CORS, cookie, HTTPS và trusted proxy.
- [x] Thêm GitHub Actions chạy typecheck, build và test.
- [x] Deploy database và backend.
- [x] Deploy frontend.
- [ ] Cấu hình logging và health check production kỹ hơn.

### Giai đoạn 6: Mở rộng sau MVP

- [ ] Share bookmark bằng public link.
- [ ] Refresh token hoặc session rotation nếu cần.
- [ ] Full-text search PostgreSQL và index phù hợp.
- [ ] Redis chỉ khi có nhu cầu cache được đo đạc.
- [ ] Rate limiting và audit log.
- [ ] Theo dõi hiệu năng và lỗi production.

## 6. Bước học kế tiếp

Củng cố nền trước, mở rộng feature sau. Thứ tự:

1. ~~Tách database test~~ — xong.
2. ~~Test ownership và cascade~~ — xong, 31/31 xanh.
3. ~~Rate limit `/auth/login` và `/auth/register`~~ — xong, `@fastify/rate-limit@11`, mặc định 10 request/15 phút theo IP, cấu hình qua `AUTH_RATE_LIMIT_MAX` và `AUTH_RATE_LIMIT_WINDOW`.
4. ~~`setErrorHandler` toàn cục~~ — xong. Toàn bộ `try/catch` trong route biến mất (routes gọn đi 248 dòng), lỗi validation trả kèm field sai.
5. Feature tiếp theo nên là **tự động lấy title/favicon/og:image từ URL**, không phải share link — nó ép học gọi HTTP ra ngoài có timeout, chống SSRF, background job, và xử lý trạng thái trung gian ở frontend.

Sau đó mới tới Giai đoạn 6: full-text search (seed 100k dòng rồi `EXPLAIN` để thấy `ILIKE '%...%'` không dùng được index), refresh token / thu hồi token, và theo dõi lỗi production.

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

### Bài học rút ra từ Test isolation

- Test import `db` từ `src/db/index.ts`, mà file đó luôn nối `DATABASE_URL` — nên `beforeEach` xoá 4 bảng thực chất đang xoá database dev. Nếu `.env` có lúc trỏ Neon production thì `yarn test` xoá luôn dữ liệu thật. `src/test/setup.ts` viết đúng ý định nhưng không nơi nào import: viết code an toàn chưa đủ, phải kiểm tra nó có thực sự chạy.
- Fallback âm thầm kiểu `DATABASE_URL_TEST || DATABASE_URL` là cách lỗi đi vào production. Với thao tác phá huỷ dữ liệu, fail cứng tốt hơn đoán.
- ESM nạp toàn bộ `import` trước khi chạy câu lệnh đầu tiên, nên gán `process.env.NODE_ENV` ở đầu file rồi `import` config tĩnh sẽ không có tác dụng — phải dùng dynamic import. `test.env` của Vitest cũng chỉ áp cho worker, không áp cho `globalSetup`.
- `dotenv` không ghi đè biến đã có trong `process.env`, nên biến từ shell/CI luôn thắng `.env`. Cũng vì vậy, muốn kiểm thử nhánh "thiếu biến" phải chạy với env file rỗng, không thể chỉ bỏ biến ở shell.

### Bài học rút ra từ test ownership

- `app.inject()` không có cookie jar như browser: phải tự moi cookie `auth` ra khỏi `response.cookies` rồi tự đính vào request sau qua `cookies: { auth: token }`. Vì `register` đã tự đăng nhập luôn nên một request là có cả user lẫn cookie.
- Truy cập chéo user phải trả **404 chứ không phải 403**: 403 nghĩa là "resource có tồn tại nhưng bạn không được phép", tức đã tiết lộ sự tồn tại của nó.
- Assert status code là chưa đủ. Route viết sai vẫn có thể ghi đè dữ liệu rồi mới trả 404, nên mỗi test ownership phải kiểm tra thêm trạng thái thật trong database.
- Cascade là hành vi của Postgres, không phải của API, nên assert ở tầng database. Điều đáng kiểm tra nhất là cascade **dừng đúng chỗ**: xoá tag không được kéo theo bookmark, và ngược lại.
- Vitest chạy các file test song song theo mặc định. Nhiều file cùng ghi vào một database test và cùng `resetDb()` sẽ xoá dữ liệu của nhau, gây test đỏ ngẫu nhiên rất khó truy. Đã đặt `fileParallelism: false`; cách khác là cấp cho mỗi file một database riêng.

### Bài học rút ra từ rate limit

- `global: false` rồi khai báo `config.rateLimit` ở từng route: chỉ chặn `/auth/login` và `/auth/register` — hai cửa duy nhất mở cho người chưa xác thực. Mỗi route có bộ đếm riêng nên đăng nhập bị chặn không kéo theo đăng ký.
- Bộ đếm theo `request.ip`, và nhờ `trustProxy: true` thì đó là IP thật lấy từ `X-Forwarded-For`. Nếu đếm nhầm theo IP của proxy Vercel/Render thì một kẻ tấn công sẽ khoá toàn bộ người dùng.
- Store nằm trong bộ nhớ tiến trình, đúng với hiện tại (Render free, một instance). Từ hai instance trở lên thì mỗi instance đếm riêng, ngưỡng thực tế nhân đôi — đó mới là lý do thật sự cần một store dùng chung như Redis, chứ không phải vì "cache cho nhanh".
- Ngưỡng thật sẽ chặn chính test suite (`ownership.test.ts` gọi `/auth/register` 28 lần từ một IP), nên test đặt `AUTH_RATE_LIMIT_MAX=1000`, còn `buildApp()` nhận `authRateLimit` qua tham số để riêng `rate-limit.test.ts` truyền ngưỡng thấp. Nguyên tắc: config nào cần đổi lúc test thì phải truyền vào được, đừng đọc thẳng từ env trong hàm.
- Giới hạn theo IP không chặn được tấn công phân tán từ nhiều IP, và ngược lại có thể khoá nhầm cả văn phòng dùng chung một IP NAT. Muốn chặt hơn thì đếm thêm theo email, hoặc chỉ đếm lần đăng nhập thất bại.

### Bài học rút ra từ error handler toàn cục

- Tách **lỗi nghiệp vụ** khỏi **lỗi hệ thống**. Lỗi nghiệp vụ là thứ route chủ động ném ra và biết chính xác client cần thấy gì (`NotFoundError`, `ConflictError`, `UnauthorizedError` — mỗi lớp mang sẵn `statusCode`). Lỗi hệ thống là mất kết nối DB, bug: không có `statusCode`, rơi xuống nhánh 500, ghi log đầy đủ nhưng không lộ chi tiết ra ngoài.
- Lỗi Postgres nằm trong chuỗi `cause` vì Drizzle bọc lại, nên phải đi dọc chuỗi đó mới lấy được `error.constraint`. Có tên constraint rồi thì một bảng ánh xạ duy nhất xử lý được mọi vi phạm unique, thay vì mỗi route tự đoán "23505 ở đây chắc là trùng email".
- Error handler phải cho qua các lỗi đã có sẵn `statusCode` do Fastify hoặc plugin sinh ra (429 của rate limit, 400 khi JSON hỏng, 415 sai content-type). Quên nhánh này thì mọi lỗi của plugin biến thành 500.
- Bẫy đã dính: `@fastify/rate-limit` **throw** chính object mà `errorResponseBuilder` trả về, và Fastify lấy status từ `error.statusCode`. Builder tự viết trả `{ message }` thiếu `statusCode` nên 429 sẽ thành 500. Bỏ builder tự viết, để plugin dùng `Error` mặc định, còn định dạng body do error handler lo.
- `safeParse` trả lỗi kèm `issues`, mỗi issue có `path` và `message` — đủ để client biết field nào sai. Trước đây mọi route đều trả `{ message: 'Invalid request' }`: đúng status code nhưng người dùng không biết sửa gì.
