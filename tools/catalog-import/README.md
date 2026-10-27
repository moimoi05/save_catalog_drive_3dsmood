# Công cụ catalog cũ

Công cụ này được giữ lại để tham khảo khi chuẩn bị dữ liệu cục bộ; không có workflow GitHub Actions hoặc nút quét trên trang admin. Thư viện khách dùng được đóng gói vào plugin: bất kỳ thay đổi model, ID Drive hoặc preview nào cần kiểm tra dữ liệu, build và bàn giao plugin mới. Chỉnh catalog ở repo này không tự cập nhật plugin đã cài.

Việc quét Drive có thể tải và băm nhiều GB dữ liệu, tiêu thụ băng thông và quota, và có thể thay danh sách catalog đầu ra. Trước khi sử dụng, sao lưu dữ liệu, kiểm tra quyền truy cập, đối chiếu số lượng và kiểm tra từng kết quả. Xem các tùy chọn trong mã `import.mjs`. Khóa API nếu cần chỉ để trong môi trường cục bộ, không lưu vào repo.

Kiểm tra công cụ: `node --test tools/catalog-import/import.test.mjs tools/catalog-import/drive-api.test.mjs`.
