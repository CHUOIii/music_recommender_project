# BUG LOG – EMBEAT AI MUSIC RECOMMENDER

## 1. Thông tin chung

| Mục | Nội dung |
|---|---|
| Dự án | EmBeat AI – Music Recommender |
| Tài liệu | Bug Log |
| Công việc | Task 4.2 – Testing & QA |
| Người thực hiện | Lê Thiện Chí – FE & QA |
| Ngày cập nhật | 13/11/2026 |
| Tài liệu liên quan | `docs/test_plan.md`, `reports/qa_report.md` |

## 2. Danh sách lỗi

| Bug ID | Mô tả lỗi | Mức độ | Trạng thái | Test case liên quan |
|---|---|---|---|---|
| BUG-001 | Python không tương thích với NumPy | High | FIXED | TC-01 (môi trường chạy) |
| BUG-002 | Top 10 có cùng giá trị Popularity 82 | Medium | NEEDS VERIFICATION | TC-03 |
| BUG-003 | Ảnh bìa danh sách không hiển thị | Medium | FIXED | TC-20 |
| BUG-004 | Ảnh bìa Now Playing không hiển thị | Medium | FIXED | TC-20 |
| BUG-005 | Calm và Chill trả về cùng danh sách đề xuất | Medium | NEEDS VERIFICATION | TC-10 |
| BUG-006 | Taste Profile xuất hiện bài hát trùng tên, khác Track ID | Medium | OPEN | TC-13 |

## 3. Chi tiết lỗi

### BUG-001 – Lỗi môi trường Python

**Hiện tượng:** Backend không chạy đúng do phiên bản Python ban đầu không tương thích với thư viện NumPy.

**Cách xử lý:** Chuyển sang sử dụng Python 3.12 và cài đặt các thư viện tương ứng.

**Kết quả:** Backend đã chạy được, Health API trả về trạng thái hoạt động.

**Trạng thái:** FIXED.

### BUG-002 – Giá trị Popularity giống nhau

**Hiện tượng:** Các bài hát trong Top 10 Popular có cùng giá trị Popularity là 82.

**Ảnh hưởng:** Khó đánh giá tính hợp lý của thứ tự xếp hạng chỉ dựa trên Popularity được hiển thị.

**Hướng xử lý:** Kiểm tra dữ liệu nguồn và logic lựa chọn, sắp xếp danh sách Popular.

**Trạng thái:** NEEDS VERIFICATION.

### BUG-003 – Ảnh bìa danh sách không hiển thị

**Hiện tượng:** Một số bài hát không có ảnh bìa trên giao diện danh sách.

**Cách xử lý:** Bổ sung cơ chế lấy thông tin ảnh bìa qua Spotify oEmbed.

**Kết quả:** Ảnh bìa đã hiển thị trong lần kiểm thử sau khi chỉnh sửa.

**Trạng thái:** FIXED.

### BUG-004 – Ảnh bìa Now Playing không hiển thị

**Hiện tượng:** Khu vực Now Playing không hiển thị ảnh bìa bài hát.

**Cách xử lý:** Điều chỉnh phần xử lý và hiển thị ảnh bìa trong Frontend.

**Kết quả:** Ảnh bìa đã hiển thị sau khi sửa.

**Trạng thái:** FIXED.

### BUG-005 – Mood Calm và Chill giống nhau

**Hiện tượng:** Hai Mood Calm và Chill trả về cùng 10 bài hát, cùng thứ tự và điểm tương đồng.

**Ảnh hưởng:** Kết quả chưa thể hiện sự khác biệt giữa hai lựa chọn tâm trạng trong lần kiểm thử.

**Hướng xử lý:** Kiểm tra cấu hình Mood, thuật toán và dữ liệu đầu vào của Backend.

**Trạng thái:** NEEDS VERIFICATION.

### BUG-006 – Taste Profile trùng bài hát

**Hiện tượng:** Trong kết quả Taste Profile, một bài hát có cùng tên và nghệ sĩ xuất hiện hai lần với Track ID khác nhau.

**Ảnh hưởng:** Danh sách đề xuất có thể thiếu tính đa dạng.

**Hướng xử lý:** Kiểm tra dữ liệu nguồn và quy tắc loại trùng. Cần xác định hai Track ID có đại diện cho cùng một bản thu hay không.

**Trạng thái:** OPEN.

## 4. Thống kê lỗi

| Trạng thái | Số lượng |
|---|---:|
| FIXED | 3 |
| NEEDS VERIFICATION | 2 |
| OPEN | 1 |
| **Tổng cộng** | **6** |

## 5. Đánh giá

Các lỗi liên quan đến môi trường chạy và hiển thị ảnh bìa đã được xử lý.

Ba vấn đề còn cần theo dõi liên quan đến Popularity, kết quả Mood và khả năng trùng bài hát trong Taste Profile.

Những vấn đề này cần được xác minh thêm với nhóm Backend/AI hoặc xử lý dữ liệu trước khi cập nhật trạng thái hoàn thành.

## 6. Kết luận

Bug Log ghi nhận 6 lỗi và vấn đề phát hiện trong quá trình kiểm thử EmBeat AI.

Trong đó, 3 lỗi đã được xử lý, 2 vấn đề cần xác minh và 1 vấn đề vẫn đang mở.

Tài liệu sẽ được cập nhật khi nhóm có kết quả xử lý và kiểm thử lại.

---
