# Chat nội bộ Kairos (SIT)

Màn `/chats` dùng `KairoConversationListV2` với Panel v2 cho hội thoại `direct`, `group`, `channel` và `business`. Backend Fastify giữ app-key, tạo/liên kết user theo `users.id` làm `externalId`, cấp token phiên cho đúng tài khoản đang đăng nhập và tạo hội thoại 1-1/nhóm/kênh nghiệp vụ.

## Kênh nghiệp vụ với đối tác

Trong tab Chat, nút **Mời đối tác** tạo Kênh nghiệp vụ (`business`) và một lời mời dùng một lần bằng SDK v2. Người tạo nhập mã tenant Kairos của đối tác (phần đứng trước `.sit.yousee.vn`); backend ghép mã mời vào trang nhận lời mời `https://<tenant>.sit.yousee.vn/doi-tac/moi?token=...`. Link và hạn dùng trả về đúng một lần, không lưu trong database hoặc log. Chỉ gửi link riêng cho đúng đối tác; khi nhận lời mời họ sẽ đọc được toàn bộ lịch sử kênh. Kairos yêu cầu quyền `tenant.partner.invite` cho luồng tạo kênh/lời mời.

Người bên đối tác xác nhận trên tenant của họ. Dự án hiện chưa có luồng nhận lời mời cho người thuộc tenant khác. Kênh `business` đã được đưa vào danh sách Panel v2 để người tạo chat trong tab Chat sau khi đối tác tham gia. Link dùng host SIT; khi Kairos công bố production endpoint cần cập nhật host theo hợp đồng mới.

## Cấu hình

- Đặt `KAIRO_APP_KEY` trong secret của **backend**. Tên `APP_KEY` hiện cũng được chấp nhận để dùng cấu hình SIT đã có. Không đặt key vào frontend hoặc commit `.env`.
- `KAIRO_SDK_BASE_URL` mặc định là `https://api.sit.yousee.vn`.
- Kairos phải cho phép origin của frontend trong CORS BFF. Với dự án này: `https://shadcn-admin-pi.vercel.app` và `http://localhost:5173` khi phát triển.
- Chạy `yarn db:migrate` trong `server/` **trước khi** đưa backend mới lên. Migration `0004` tạo bảng `kairo_sessions` để thu hồi token Kairos khi người dùng đăng xuất.
- `server/.env` chỉ có tác dụng cho tiến trình chạy tại máy đó. Backend Render cần được đặt app-key riêng trong Environment của dịch vụ.

## Kiểm tra

Đăng nhập bằng hai tài khoản ứng dụng, vào Chat, mở hội thoại 1-1 và gửi tin hai chiều. Thử tạo nhóm với ít nhất hai đồng nghiệp, tải lại trang, đăng xuất và kiểm tra phiên Kairos bị thu hồi. API `GET /api/kairo/users` chỉ trả tài khoản ứng dụng thật, không dùng dữ liệu mẫu của trang Users.

Kairos hiện chỉ công bố SIT. Cấu hình frontend đang trỏ tới endpoint và bundle SIT; chưa có endpoint production công khai. Panel v2 chưa tự cung cấp badge số chưa đọc hoặc Web Push cho ứng dụng chủ.

Tài liệu: [tích hợp](https://kairos-7.gitbook.io/kairos/tich-hop.md), [Panel v2](https://kairos-7.gitbook.io/kairos/tich-hop/panel-v2-quickstart-10-phut.md), [trạng thái](https://kairos-7.gitbook.io/kairos/trang-thai-and-gioi-han-hien-tai.md).
