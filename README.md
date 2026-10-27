# Catalog và quản trị thư viện 3DSMOOD

Repo này lưu catalog JSON và ảnh preview công khai để plugin 3ds Max tải từ GitHub Pages. File model vẫn nằm trên Google Drive. Source giao diện quản trị nằm trong `apps/license-admin`; repo công khai này không chứa mật khẩu, license khách hàng hay khóa ký riêng.

## Địa chỉ catalog

Sau khi workflow Pages chạy thành công:

https://moimoi05.github.io/save_catalog_drive_3dsmood/catalog.json

GitHub Actions kiểm tra và publish nội dung trong `library/public/`.

## Giao diện admin

Vercel project `3dsmood-license-admin` dùng root directory `apps/license-admin` và Node.js 24. Trang admin tạo license có chữ ký cho mã máy và gửi yêu cầu quét Drive. Private key, mật khẩu admin và session secret chỉ nằm trong Vercel Production environment variables.

Xem [hướng dẫn triển khai và cấu hình](apps/license-admin/README.md).

## Cập nhật catalog từ Drive

- Thêm GitHub Actions secret `GOOGLE_DRIVE_API_KEY` vào repo này; giới hạn API key cho Google Drive API.
- Workflow `Drive catalog sync` chỉ chạy khi admin bấm **Làm mới catalog từ Drive** trong trang admin hoặc chạy thủ công từ tab Actions; không có lịch quét hàng tuần.
- Workflow cập nhật `library/public/catalog.json` và `library/public/previews/` trong cùng repo bằng token GitHub Actions tích hợp; không cần token ghi sang repo khác.
- Mặc định workflow không xuất bản nếu số model thấp hơn 360. Chỉ thay `CATALOG_MINIMUM_MODEL_COUNT` sau khi kiểm tra thay đổi inventory có chủ ý.
- Có thể đổi Drive root bằng repo variable `DRIVE_FOLDER_ID`.

Trong Drive, mỗi model cần một file model/archive được hỗ trợ và một ảnh PNG/JPEG/WebP cùng tên gốc trong cùng thư mục, ví dụ `chair.zip` và `chair.jpg`. Tên thư mục con trở thành danh mục. Giữ quyền Editor chỉ cho admin. Model cần được chia sẻ đủ quyền để plugin khách tải trực tiếp.

Sau khi tải model lên Drive, admin bấm **Làm mới catalog từ Drive**. Nút **Kiểm tra trạng thái** chỉ tải lại tiến độ quét; khi workflow báo hoàn tất, GitHub Pages đã xuất bản catalog mới.

## Chỉnh catalog thủ công

Thông thường hãy dùng nút quét trong admin hoặc chạy workflow từ Actions. Nếu sửa catalog thủ công, cập nhật `library/public/catalog.json` và preview được tham chiếu, rồi chạy:

```powershell
node library/validate-catalog.mjs
node --test library/catalog.test.mjs
```

Mỗi mục cần `id`, `name`, `category`, `preview`, `driveFileId`, `fileName` và SHA-256 thật của file. Xem `library/catalog.schema.json` và `library/catalog.example.json`.

## Bật GitHub Pages lần đầu

Trong GitHub repo, mở Settings → Pages và chọn GitHub Actions làm nguồn deploy. Sau đó kiểm tra workflow Publish model library chạy thành công.

## Quyền truy cập

Catalog và preview là nội dung công khai. Model được tải trực tiếp từ Google Drive; `driveFileId` không bảo vệ file. Bất kỳ ai đọc được catalog đều có thể xem ID và tên file. Không lưu khóa riêng, license khách hàng, mật khẩu, token hay credential vào repo.
