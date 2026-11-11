# KẾ HOẠCH KIỂM THỬ (TEST PLAN) - EMBEAT AI MUSIC RECOMMENDER SYSTEM

## 1. Tổng quan dự án
- **Tên dự án:** Music Recommender System (EmBeat AI)
- **Mục tiêu hệ thống:** Xây dựng nền tảng gợi ý âm nhạc trực tuyến dựa trên các đặc trưng âm học (Audio Features & Content-Based Recommendation) khai thác tập dữ liệu lớn `GD-Studio/embeat_45m_spotify_tracks` (Hugging Face).
- **Mục tiêu kiểm thử (QA Objectives):** 
  - Đảm bảo tính ổn định và mượt mà của giao diện Single Page Application (SPA).
  - Kiểm tra độ chính xác trong luồng chuyển đổi giữa các view/tab (Trang chủ, Gu âm nhạc, Phân tích Audio).
  - Xác thực các tính năng tương tác người dùng: Thanh tìm kiếm, bộ lọc cảm xúc nhanh (Mood), và cơ chế hiển thị/phát nhạc của trình phát Spotify Player nhúng.

## 2. Phạm vi kiểm thử (Scope of Testing)
- **In-Scope (Thuộc phạm vi kiểm thử):**
  - **Giao diện & Điều hướng SPA:** Kiểm tra phản hồi của Sidebar khi chuyển tab và logic tự động ẩn/hiện thanh tìm kiếm & cụm nút Mood (`#searchAndMoodSection`).
  - **Trình phát nhạc nhúng (Spotify Player):** Kiểm tra vị trí hiển thị cố định ở chân trang và cơ chế cập nhật bài hát.
  - **Tương tác thành phần (UI Components):** Trạng thái active/hover của các nút bấm chọn mood và ô nhập từ khóa tìm kiếm.
- **Out-of-Scope (Không thuộc phạm vi kiểm thử trực tiếp):**
  - Kiểm thử hiệu năng thuật toán tính toán Cosine Similarity chuyên sâu của Backend.
  - Quản lý pipeline hạ tầng dữ liệu lớn trên Hugging Face.

## 3. Các kịch bản kiểm thử chi tiết (Test Case Matrix)

| Test Case ID | Module / Chức năng | Mô tả kịch bản (Test Scenario) | Thao tác thực hiện (Steps) | Kết quả kỳ vọng (Expected Result) | Mức độ | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-NAV-01** | Điều hướng SPA | Chuyển đổi sang tab "Gu âm nhạc" (`favorites`) | Click vào mục "Gu âm nhạc" trên Sidebar | Giao diện hiển thị danh sách bài hát yêu thích; cấu trúc layout giữ nguyên ổn định. | High | PASS |
| **TC-NAV-02** | Điều hướng SPA | Chuyển đổi sang tab "Phân tích Audio" (`analysis`) | Click vào mục "Phân tích Audio" trên Sidebar | Màn hình chuyển sang trang thông số mô hình AI; **thanh tìm kiếm và cụm nút Mood tự động ẩn đi**. | High | PASS |
| **TC-NAV-03** | Điều hướng SPA | Quay lại tab "Trang chủ" (`home`) | Click vào mục "Trang chủ" trên Sidebar | Màn hình Home hiển thị trở lại; thanh tìm kiếm và cụm nút Mood tự động hiện ra bình thường. | High | PASS |
| **TC-PLR-01** | Spotify Player | Hiển thị trình phát nhạc nhúng | Tải và truy cập trang giao diện SPA | Trình phát nhạc Spotify Player nằm cố định đúng vị trí ở chân khu vực nội dung chính (`main`). | High | PASS |
| **TC-PLR-02** | Spotify Player | Tương tác chọn bài hát để phát | Click chọn bài hát bất kỳ từ danh sách gợi ý | Trình phát nhạc cập nhật URL iframe Spotify tương ứng và đồng bộ tiêu đề bài hát chính xác. | Medium | PASS |
| **TC-MOOD-01** | Mood Filtering | Lọc nhanh danh sách theo cảm xúc | Click chọn một nút cảm xúc (VD: Tình yêu, EDM) | Nút bấm chuyển sang trạng thái active (đổi màu/viền), gửi truy vấn lọc tương ứng lên giao diện. | Medium | PASS |
| **TC-SRC-01** | Search Function | Tìm kiếm bài hát theo từ khóa | Nhập từ khóa vào ô tìm kiếm và thực hiện lệnh tìm | Hệ thống trả về và hiển thị danh sách kết quả bài hát khớp với từ khóa truy vấn của người dùng. | High | PASS |

## 4. Quy trình quản lý lỗi (Bug Management Workflow)
- Các lỗi phát sinh trong quá trình kiểm thử giao diện và luồng điều hướng sẽ được ghi nhận và theo dõi tập trung tại tệp **`docs/bug_log.md`**.
- Các mức độ lỗi (Severity) được phân loại cụ thể: *High* (Ảnh hưởng luồng chính/hiển thị), *Medium* (Lỗi logic thành phần), *Low* (Lỗi giao diện nhỏ, màu sắc, style).

## 5. Tiêu chí nghiệm thu (Exit Criteria)
- 100% các Test Cases thuộc mức độ `High` đạt kết quả `PASS`.
- Các lỗi giao diện và điều hướng được ghi nhận trong Bug Log đã được khắc phục hoàn toàn (`FIXED`).
- Toàn bộ tài liệu kiểm thử được đồng bộ lên nhánh chính của dự án trên GitHub.