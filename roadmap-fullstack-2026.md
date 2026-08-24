# Lộ trình Frontend → Fullstack 2026

Xuất phát điểm: đã có nền frontend, mục tiêu lên fullstack trong năm 2026.
Hướng đi: **Node.js/TypeScript** (tận dụng kiến thức JS/TS sẵn có thay vì đổi stack hoàn toàn).

## 1. Tài nguyên học theo chủ đề

### HTTP & REST API design
- [MDN HTTP docs](https://developer.mozilla.org/en-US/docs/Web/HTTP) — status code, headers, caching
- [roadmap.sh/backend](https://roadmap.sh/backend) — bản đồ tổng quan, dùng để track tiến độ

### Node.js/TypeScript backend
- [Node.js official docs](https://nodejs.org/en/docs) — event loop, streams, modules
- Framework: bắt đầu với **Express** hoặc **Fastify** (đơn giản, học được cơ chế bên dưới); sau khi quen thì thử **NestJS** (kiến trúc rõ ràng, hợp dev quen TypeScript/OOP)
- Validation: [Zod docs](https://zod.dev)

### Database
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com) — SQL căn bản đến nâng cao
- [Use The Index, Luke](https://use-the-index-luke.com) — hiểu index, tối ưu query (đọc sau khi đã quen SQL)
- ORM: [Prisma docs](https://www.prisma.io/docs) hoặc [Drizzle docs](https://orm.drizzle.team/docs/overview) — Drizzle gần SQL hơn, Prisma dev-experience mượt hơn

### Auth & bảo mật
- [jwt.io/introduction](https://jwt.io/introduction) — hiểu JWT
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org) — tra cứu khi cần (password hashing, session, CORS...)

### Testing
- [Vitest docs](https://vitest.dev) — phần API/DB khác ở chỗ dùng thêm supertest hoặc test container

### DevOps cơ bản
- [Docker Get Started](https://docs.docker.com/get-started/) — đóng gói app
- [GitHub Actions docs](https://docs.github.com/en/actions) — CI/CD đơn giản
- Deploy thử lên Railway hoặc Render trước khi động tới Kubernetes

### System design (học sau, khi đã có project chạy được)
- [roadmap.sh/system-design](https://roadmap.sh/system-design)
- Sách *Designing Data-Intensive Applications* (Kleppmann) — đọc dần, không cần vội

## 2. Dự án thực hành: Bookmark Manager (có tag, search, share)

Chọn project này vì đủ nhỏ để không nản nhưng đủ tính năng để đi qua toàn bộ lộ trình, và dùng thật được sau khi xong.

| Giai đoạn | Việc làm | Kỹ năng luyện |
|---|---|---|
| 1. Setup | Express/Fastify + TypeScript, kết nối PostgreSQL bằng Prisma | Node.js, DB schema |
| 2. CRUD API | Tạo/sửa/xoá/list bookmark, gắn tag | REST design, validation (Zod) |
| 3. Auth | Đăng ký/đăng nhập bằng JWT, mỗi user chỉ thấy bookmark của mình | Auth, bảo mật cơ bản |
| 4. Search & filter | Tìm theo tag, full-text search trên title/note | SQL nâng cao, index |
| 5. Testing | Viết integration test cho các endpoint chính | Vitest + supertest |
| 6. Frontend nối API | Dùng lại stack frontend hiện có, gọi API thật | Kết nối FE-BE, xử lý auth token phía client |
| 7. Deploy | Docker hoá, deploy lên Railway/Render, thêm CI chạy test | Docker, CI/CD |
| 8. Mở rộng (optional) | Share bookmark qua link public, cache kết quả search bằng Redis | Caching, thiết kế thêm tính năng |

**Cách chạy:** làm tuần tự từng giai đoạn, mỗi giai đoạn xong thì commit + tự review lại code trước khi qua bước tiếp — học tới đâu áp dụng ngay tới đó, không dồn lý thuyết trước khi code.
