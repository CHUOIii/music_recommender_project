# NHẬT KÝ THEO DÕI LỖI (BUG LOG) - EMBEAT AI MUSIC RECOMMENDER SYSTEM

## 1. Thông tin chung
- **Dự án:** Music Recommender System (EmBeat AI)
- **Người quản lý QA:** Lê Thiện Chí (Frontend & QA Lead)
- **Mục đích:** Ghi nhận, phân loại, theo dõi và xử lý các lỗi phát sinh trong quá trình tích hợp hệ thống (giữa Frontend và Backend/Dataset), giao diện SPA và luồng hiển thị dữ liệu.

---

## 2. Quy định phân loại mức độ lỗi (Severity Levels)
- **High (Cao):** Lỗi ảnh hưởng nghiêm trọng đến tính năng cốt lõi (không tìm thấy kết quả do lệch từ khóa API, mất dữ liệu hiển thị trọng điểm).
- **Medium (Trung bình):** Lỗi logic giao diện, ẩn/hiện thành phần, sai lệch bố cục SPA.
- **Low (Thấp):** Lỗi nhỏ về định dạng CSS, màu sắc, hiệu ứng tương tác.

---

## 3. Danh sách lỗi ghi nhận & Xử lý (Bug Tracking Table)

| Bug ID | Ngày phát hiện | Mô tả chi tiết lỗi (Issue Description) | Mức độ | Trạng thái | Giải pháp khắc phục (Resolution) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | 2026-11-10 | Thanh tìm kiếm & bộ nút Mood vẫn hiển thị khi người dùng chuyển sang tab "Phân tích Audio". | Medium | FIXED | Gom nhóm container vào `#searchAndMoodSection` và bổ sung điều kiện ẩn (`classList.add('hidden')`) khi `target === 'analysis'` trong script điều hướng `app.js`. |
| **BUG-02** | 2026-11-11 | Trình phát nhạc nhúng Spotify Player bị trôi hoặc mất vị trí cố định khi cuộn trang nội dung dài. | High | FIXED | Đưa widget player về đúng bố cục khối cố định (fixed layout) ở chân khu vực nội dung chính (`main`), đảm bảo hiển thị ổn định trên mọi độ phân giải. |
| **BUG-03** | 2026-11-11 | Các nút chọn nhanh Mood bị mất định dạng màu sắc/border khi chuyển đổi trạng thái click. | Low | FIXED | Khôi phục và chuẩn hóa danh sách các lớp CSS Tailwind (`bg-zinc-900/60 hover:bg-emerald-500/20 data-mood`) cho toàn bộ cụm button mood. |
| **BUG-04** | 2026-11-11 | Giao diện bị lệch nhẹ khoảng trống chân trang khi trình phát nhạc nhúng chưa tải xong iframe. | Low | FIXED | Thêm chiều cao tối thiểu (`min-height`) cố định cho container trình phát nhạc `#spotifyPlayer` để tránh biến dạng khung hình (layout shift). |
| **BUG-05** | 2026-11-12 | **Từ khóa tìm kiếm phía Frontend không khớp với trường dữ liệu (schema) ở Backend/Dataset, dẫn đến việc tìm kiếm không trả về kết quả.** | High | FIXED | Chuẩn hóa lại tham số query và key field khớp giữa request của Frontend (`app.js`) và response trả về từ API/Dataset Hugging Face (map đúng tên thuộc tính tên bài hát và nghệ sĩ). |
| **BUG-06** | 2026-11-12 | **Danh sách gợi ý render thành công nhưng không hiển thị tên bài hát (bị trống trường tiêu đề trên UI).** | High | FIXED | Cập nhật cấu trúc DOM rendering trong JavaScript, bổ sung chính xác biến trỏ tới thuộc tính tên bài hát (`track_name` / `title`) từ object dữ liệu trả về thay vì bỏ trống hoặc gọi sai key. |

---

## 4. Tổng kết trạng thái kiểm thử (Summary)
- **Tổng số lỗi ghi nhận:** 6
- **Đã khắc phục (Fixed):** 6/6 (100%)
- **Lỗi tồn đọng (Open/Pending):** 0