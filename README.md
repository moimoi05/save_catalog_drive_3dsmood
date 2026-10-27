# Catalog thư viện 3DSMOOD

Repo này lưu catalog JSON và ảnh preview công khai để plugin 3ds Max tải từ GitHub Pages. File model vẫn nằm trên Google Drive; không đưa file model, plugin, công cụ ký license hoặc khóa riêng vào repo này.

## Địa chỉ catalog

Sau khi bật GitHub Pages và workflow deploy chạy thành công:

https://moimoi05.github.io/save_catalog_drive_3dsmood/catalog.json

Repo dùng GitHub Actions để kiểm tra catalog và publish nội dung trong library/public/.

## Thêm hoặc cập nhật model

1. Tải model/archive lên đúng thư mục trên Google Drive và đặt quyền chia sẻ cho phép khách tải file.
2. Thêm ảnh preview vào library/public/previews/. Có thể tạo thư mục con; đường dẫn trong JSON tính từ library/public/, ví dụ previews/architecture/chair.jpg.
3. Thêm một phần tử vào library/public/catalog.json. Xem library/catalog.schema.json và library/catalog.example.json để biết cấu trúc. Mỗi model cần id, name, category, preview, driveFileId, fileName, sha256; entryFile là tùy chọn.
4. Giữ driveFileId và tên file đúng với file trên Drive. Tính SHA-256 của file model/archive thực tế; không điền giá trị giả.
5. Trước khi push, chạy:
   - node library/validate-catalog.mjs
   - node --test library/catalog.test.mjs
6. Push thay đổi lên nhánh main. GitHub Actions sẽ kiểm tra và publish lại Pages.

Ảnh preview phải là PNG, JPEG hoặc WebP và không vượt quá 2 MiB. Không xóa ảnh còn được catalog tham chiếu.

## Bật GitHub Pages lần đầu

Trong GitHub repo, mở Settings → Pages và chọn GitHub Actions làm nguồn deploy. Sau đó kiểm tra workflow Publish model library chạy thành công; chỉ khi đó URL catalog phía trên mới hoạt động.

## Lưu ý về quyền truy cập

Catalog và preview là nội dung công khai. Model được tải trực tiếp từ Google Drive; driveFileId không phải cơ chế bảo vệ quyền truy cập. Bất kỳ ai có quyền đọc repo/catalog đều có thể xem ID và tên file. Không lưu khóa ký license, license của khách, mật khẩu hoặc thông tin bí mật tại đây.
