# 3DSMOOD — quản trị license

Repo này chứa trang quản trị license tại `apps/license-admin`. Vercel chạy trang đăng nhập và ký license trên server; khóa ký riêng chỉ được lưu phía server. Xem [hướng dẫn quản trị](apps/license-admin/README.md).

Plugin được bàn giao kèm danh sách model và ảnh preview để khách duyệt offline. Khi bấm Import, plugin cần kết nối Internet để tải file model tương ứng từ Google Drive. Sau khi thêm hoặc đổi model, đường dẫn Drive hoặc ảnh preview, cần build và bàn giao bản plugin mới. Các thư mục catalog và công cụ cũ được giữ lại làm dữ liệu tham khảo; trang admin không cập nhật thư viện qua GitHub Actions hoặc GitHub Pages.
