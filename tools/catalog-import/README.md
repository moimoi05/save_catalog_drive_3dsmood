# Nhập catalog từ thư mục Google Drive công khai

Công cụ dành cho chủ sở hữu, chạy bằng Node.js 20 trở lên; **không đóng gói cho khách**. Nó đọc Drive và cập nhật catalog cùng preview trong repo này. GitHub Actions gọi công cụ mỗi tuần hoặc theo nút quét trong trang admin; workflow Pages riêng sẽ kiểm tra rồi publish.

Trước khi chạy, kiểm tra quyền Viewer “Anyone with the link” cho từng file, tự xác minh số cặp model/ảnh trong toàn bộ cây Drive và sao lưu catalog hiện tại. Thư mục cache phải nằm ngoài `library/public`, ở ổ có đủ chỗ cho ảnh và state. Model được stream qua SHA-256, không lưu bản sao archive; vẫn tiêu thụ toàn bộ băng thông và quota khi chạy lần đầu (có thể nhiều GB). Không chạy nếu Google đang trả hạn mức hoặc chặn automated queries.

```powershell
node tools/catalog-import/import.mjs `
  --folder '1qQgoy1yLQuaO9S-yT_ZT7nai6EAA4OwA' `
  --cache 'C:\LibraryImportCache' `
  --out 'library/public/catalog.json' `
  --expected-models COUNT
```

Thay `COUNT` bằng số model thực đã tự xác minh tại thời điểm chạy. `--expected-models` yêu cầu số lượng chính xác; worker định kỳ mặc định dùng `--minimum-models 360`, theo inventory của root Drive được quét trực tiếp. Ngưỡng này cho phép bổ sung model mà vẫn chặn danh sách bị cắt xuống dưới số lượng hiện tại. Chỉ giảm mức tối thiểu sau khi kiểm tra và xác nhận việc xóa model có chủ ý.

Worker tự động dùng Drive API v3 (`--list-source drive-api`) để phân trang danh sách thư mục; cần biến môi trường `GOOGLE_DRIVE_API_KEY` bị giới hạn chỉ cho Google Drive API. API key chỉ liệt kê metadata của thư mục/file công khai, không cấp quyền đọc file riêng. Chạy local không có key thì `--list-source auto` dùng cách đọc HTML hiện có, vốn không phải API ổn định. Không đưa API key vào đối số dòng lệnh hoặc log.

Công cụ quét mọi thư mục con, ghép archive/model (`zip`, `rar`, `7z`, `max`, `fbx`, `obj`) với một ảnh PNG/JPG/JPEG/WebP có **chính xác cùng tên gốc** trong cùng thư mục. Model thiếu ảnh được báo `WARNING` và dùng ảnh chung ghi “NO PREVIEW AVAILABLE”; không ghép một ảnh không liên quan. Nếu có nhiều ảnh cùng tên gốc, model trùng tên hoặc số lượng thấp hơn ngưỡng, công cụ dừng mà không thay catalog. File ảnh không có model cùng tên không được thêm. Mục catalog đã có được giữ nguyên `id`, `name`, `category` và `entryFile` theo Drive file ID; danh mục model mới lấy từ đường dẫn thư mục.

Thông tin từng file đã kiểm tra và preview được lưu trong cache ngoài public để lần sau tiếp tục. GitHub Actions lưu cache giữa các lần chạy; archive chỉ được tải lại để tính SHA-256 khi ID, kích thước hoặc thời điểm sửa đổi thay đổi. Cache có thể hết hạn, khi đó lần quét tiếp theo có thể phải tải và hash lại nhiều file.

Sau khi toàn bộ model và preview cần thiết được tải, công cụ ghi preview theo hash nội dung và thay catalog bằng danh sách quét qua file tạm/đổi tên. Các mục không còn trong Drive sẽ bị bỏ khi scan được phép chạy; worker hiện chặn số lượng thấp hơn ngưỡng 360 để tránh xóa nhầm. Archive hash và preview được lưu ở cache riêng: thay ảnh không làm tải và băm lại model archive nếu metadata archive không đổi. Sau khi toàn bộ model và preview cần thiết được tải, công cụ ghi preview theo hash nội dung và thay catalog bằng danh sách quét qua file tạm/đổi tên. Các mục không còn trong Drive sẽ bị bỏ khi scan được phép chạy; worker hiện chặn số lượng thấp hơn ngưỡng 360 để tránh xóa nhầm. Archive hash và preview được lưu ở cache riêng: thay ảnh không làm tải và băm lại model archive nếu metadata archive không đổi. Sau khi validator thành công, workflow cập nhật catalog cùng preview trong repo này bằng GITHUB_TOKEN có quyền Contents: write; workflow Pages riêng sẽ publish.

Các lưu ý về HTML `_DRIVE_ivd` bên dưới chỉ áp dụng cho `--list-source html`; Google không công bố định dạng này làm API ổn định. Parser không dùng `eval`, dừng nếu định dạng thay đổi và cần đối chiếu số lượng vì HTML có thể bị cắt. Worker tự động dùng Drive API v3, phân trang đến hết danh sách và dừng nếu API báo `incompleteSearch`. Với danh sách `null` ở chế độ HTML, công cụ chỉ coi thư mục là rỗng sau khi đối chiếu ID trong metadata và một trang embedded riêng có danh sách trống, cùng tên thư mục. Hãy đối chiếu tên/category và ảnh trước lần publish tự động đầu tiên. Nếu thiếu quyền đọc, tên không tương thích Windows, ảnh hỏng, file >4 GiB hoặc preview >2 MiB, sửa nguồn rồi chạy lại. Không xóa `import.lock` nếu một tiến trình import còn chạy; nếu máy bị ngắt, kiểm tra không còn tiến trình trước khi xóa lock cũ.

Kiểm tra: `node --test tools/catalog-import/import.test.mjs tools/catalog-import/drive-api.test.mjs`.
