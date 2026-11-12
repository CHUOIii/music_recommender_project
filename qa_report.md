# QA REPORT – EMBEAT AI MUSIC RECOMMENDER

## 1. Thông tin chung

| Mục | Nội dung |
|---|---|
| Dự án | EmBeat AI – Music Recommender |
| Tài liệu | QA Report |
| Công việc | Task 4.2 – Testing & QA |
| Người thực hiện | Lê Thiện Chí – Frontend & QA |
| Phạm vi | Frontend, API Integration, Recommendation, UI/UX |
| Môi trường | Windows, Microsoft Edge, VS Code Live Server |
| Frontend | `http://127.0.0.1:5500/frontend/index.html` |
| Backend | `http://127.0.0.1:8000` |
| Ngày tổng hợp | 13/11/2026 |

---

## 2. Mục đích kiểm thử

Quá trình kiểm thử được thực hiện nhằm đánh giá khả năng hoạt động của các chức năng chính trong dự án EmBeat AI, đặc biệt là việc tích hợp giữa Frontend và Backend.

Các nội dung được kiểm thử bao gồm:

- Kết nối Backend và gọi API.
- Hiển thị Top 10 Popular.
- Tìm kiếm bài hát.
- Gợi ý AI theo bài hát và tâm trạng.
- Quản lý Favorites và tạo Taste Profile.
- Phát nhạc bằng Spotify Embed.
- Hiển thị đặc trưng âm học bằng Radar Chart.
- Xử lý trạng thái Loading, Empty và Error.
- Kiểm tra giao diện và trải nghiệm người dùng.

Việc kiểm thử tập trung vào các chức năng đã được triển khai trong phiên bản hiện tại của dự án.

---

## 3. Phạm vi và phương pháp kiểm thử

Test Plan hiện tại gồm **28 test case**, chia thành 5 nhóm chức năng.

| Nhóm | Nội dung | Số test case |
|---|---|---:|
| A | Backend, Search và Popular | 6 |
| B | AI Recommendation và Mood | 5 |
| C | Favorites và Taste Profile | 7 |
| D | Spotify Player và Radar Chart | 5 |
| E | Loading, Error và giao diện | 5 |
| **Tổng cộng** | | **28** |

Các phương pháp kiểm thử được áp dụng:

- **Functional Testing:** Kiểm tra chức năng bằng thao tác trực tiếp trên giao diện.
- **API Integration Testing:** Kiểm tra quá trình gửi yêu cầu và nhận dữ liệu giữa Frontend và Backend.
- **UI Testing:** Kiểm tra bố cục, hình ảnh, nút thao tác và nội dung hiển thị.
- **Negative Testing:** Kiểm tra trường hợp không có kết quả hoặc Backend mất kết nối.
- **Regression Testing:** Kiểm tra lại một số chức năng sau khi sửa lỗi.

---

## 4. Tổng hợp kết quả kiểm thử

### 4.1. Thống kê chung

| Trạng thái | Số lượng | Tỷ lệ |
|---|---:|---:|
| PASS | 22 | 78,57% |
| PARTIAL | 2 | 7,14% |
| FAIL | 1 | 3,57% |
| NEEDS VERIFICATION | 2 | 7,14% |
| NOT TESTED | 1 | 3,57% |
| **Tổng cộng** | **28** | **100%** |

*Các tỷ lệ được làm tròn đến hai chữ số thập phân.*

Trong 28 test case, có 22 trường hợp đạt yêu cầu, 2 trường hợp hoạt động một phần, 1 trường hợp không đạt, 2 trường hợp cần xác minh thêm và 1 trường hợp chưa được kiểm thử.

### 4.2. Kết quả theo từng nhóm

| Nhóm chức năng | PASS | PARTIAL | FAIL | NEEDS VERIFICATION | NOT TESTED |
|---|---:|---:|---:|---:|---:|
| A. Backend, Search và Popular | 5 | 0 | 0 | 1 | 0 |
| B. AI Recommendation và Mood | 4 | 1 | 0 | 0 | 0 |
| C. Favorites và Taste Profile | 6 | 0 | 1 | 0 | 0 |
| D. Spotify Player và Radar Chart | 4 | 0 | 0 | 1 | 0 |
| E. Loading, Error và giao diện | 3 | 1 | 0 | 0 | 1 |
| **Tổng cộng** | **22** | **2** | **1** | **2** | **1** |

---

## 5. Kết quả kiểm thử chi tiết

### 5.1. Backend, Search và Popular

Backend đã hoạt động và trả về trạng thái `status: ok`, `model_loaded: true`. Trong lần kiểm thử, hệ thống ghi nhận 29.985 bài hát được nạp.

Chức năng Top 10 Popular hiển thị danh sách 10 bài hát từ API. Chức năng Search hoạt động khi tìm kiếm theo nghệ sĩ, xử lý trường hợp không có kết quả và giới hạn số lượng kết quả trả về.

Tuy nhiên, các bài hát trong Top 10 từng có cùng giá trị Popularity là 82. Vấn đề này cần được nhóm Backend/Data kiểm tra thêm để xác minh dữ liệu và cách xếp hạng.

**Kết quả:** 5 PASS, 1 NEEDS VERIFICATION.

**Vấn đề liên quan:** BUG-002.

### 5.2. AI Recommendation và Mood

Chức năng AI Recommendation đã gọi API gợi ý theo bài hát và hiển thị danh sách các bài hát tương tự cùng điểm Similarity/Match.

Các Mood Happy, Sad, Energetic và Focus đã được kiểm thử và trả về kết quả.

Riêng Calm và Chill từng trả về cùng 10 bài hát, cùng thứ tự và điểm tương đồng. Mặc dù hai chức năng vẫn hoạt động, kết quả cần được xác minh thêm để đánh giá sự khác biệt giữa các Mood.

**Kết quả:** 4 PASS, 1 PARTIAL.

**Vấn đề liên quan:** BUG-005.

### 5.3. Favorites và Taste Profile

Các chức năng quản lý Favorites đã được kiểm thử, bao gồm:

- Thêm bài hát vào Favorites.
- Hiển thị danh sách bài hát yêu thích.
- Xóa một bài hát khỏi Favorites.
- Lưu dữ liệu Favorites sau khi tải lại trang.
- Xóa toàn bộ danh sách Favorites.

Dữ liệu Favorites được lưu bằng `localStorage` trên trình duyệt.

Chức năng Taste Profile đã gửi danh sách Track ID lên API `/api/v1/recommend/profile` và nhận danh sách bài hát đề xuất từ Backend.

Tuy nhiên, trong một lần kiểm thử, kết quả Taste Profile xuất hiện một bài hát có cùng tên và nghệ sĩ nhưng khác Track ID. Điều này có thể ảnh hưởng đến tính đa dạng của danh sách gợi ý.

**Kết quả:** 6 PASS, 1 FAIL.

**Vấn đề liên quan:** BUG-006.

### 5.4. Spotify Player và Radar Chart

Spotify Embed đã được kiểm thử và hoạt động trên giao diện.

Các lỗi ảnh bìa trong danh sách bài hát và khu vực Now Playing đã được sửa. Trường hợp bài hát không có Spotify Embed cũng được ghi nhận PASS theo Test Plan hiện tại.

Radar Chart đã hiển thị 9 đặc trưng âm học của bài hát. Phiên bản Frontend mới có logic hỗ trợ so sánh hai bài hát trên cùng biểu đồ.

Tuy nhiên, khả năng hiển thị đồng thời hai bộ dữ liệu trên Radar Chart vẫn cần được xác nhận lại bằng thao tác trực tiếp trên trình duyệt.

**Kết quả:** 4 PASS, 1 NEEDS VERIFICATION.

**Vấn đề liên quan:** BUG-003 và BUG-004 đã được xử lý.

### 5.5. Loading, Error và giao diện

Frontend đã hiển thị Loading State khi giả lập kết nối mạng chậm.

Khi Backend bị tắt, hệ thống hiển thị thông báo lỗi kết nối. Sau khi Backend được khởi động lại, Frontend tiếp tục hoạt động bình thường.

Giao diện desktop đã được kiểm tra và chỉnh sửa một số vấn đề về bố cục, đặc biệt là khu vực Now Playing. Tuy nhiên, việc đánh giá giao diện desktop vẫn chưa hoàn tất toàn bộ.

Giao diện mobile chưa được kiểm thử.

**Kết quả:** 3 PASS, 1 PARTIAL, 1 NOT TESTED.

---

## 6. Tổng hợp lỗi

Trong quá trình kiểm thử, nhóm đã ghi nhận 6 lỗi và vấn đề cần theo dõi.

| Bug ID | Mô tả | Trạng thái |
|---|---|---|
| BUG-001 | Python không tương thích với NumPy | FIXED |
| BUG-002 | Top 10 có cùng giá trị Popularity 82 | NEEDS VERIFICATION |
| BUG-003 | Ảnh bìa danh sách không hiển thị | FIXED |
| BUG-004 | Ảnh bìa Now Playing không hiển thị | FIXED |
| BUG-005 | Calm và Chill trả về cùng danh sách | NEEDS VERIFICATION |
| BUG-006 | Taste Profile xuất hiện bài hát trùng tên, khác Track ID | OPEN |

### Thống kê lỗi

| Trạng thái | Số lượng |
|---|---:|
| FIXED | 3 |
| NEEDS VERIFICATION | 2 |
| OPEN | 1 |
| **Tổng cộng** | **6** |

Ba lỗi đã được xử lý chủ yếu liên quan đến môi trường chạy và hiển thị giao diện.

Các vấn đề còn lại liên quan đến dữ liệu Popularity, kết quả gợi ý theo Mood và bài hát trùng trong Taste Profile. Những vấn đề này cần được nhóm Backend/AI tiếp tục kiểm tra.

---

## 7. Đánh giá chất lượng hệ thống

### 7.1. Những chức năng đã hoạt động

Qua quá trình kiểm thử, các chức năng chính của EmBeat AI đã có kết quả đạt yêu cầu:

- Backend hoạt động và kết nối được với Frontend.
- Top 10 Popular hiển thị danh sách bài hát.
- Search tìm kiếm và xử lý trường hợp không có kết quả.
- AI Recommendation trả về bài hát tương tự.
- Happy, Sad, Energetic và Focus Mood hoạt động.
- Favorites hỗ trợ thêm, hiển thị, xóa và lưu dữ liệu.
- Taste Profile nhận dữ liệu từ Favorites và gọi API gợi ý.
- Spotify Embed hoạt động.
- Ảnh bìa và đặc trưng âm học được hiển thị.
- Loading và Error State hoạt động khi thay đổi điều kiện kết nối.

Các kết quả này cho thấy hệ thống đã có thể thực hiện những luồng chức năng chính phục vụ demo.

### 7.2. Những vấn đề còn tồn tại

Một số nội dung vẫn cần tiếp tục kiểm tra hoặc hoàn thiện:

- Xác minh dữ liệu Popularity trong Top 10.
- Kiểm tra nguyên nhân Calm và Chill trả về cùng kết quả.
- Xử lý trường hợp bài hát trùng trong Taste Profile.
- Xác nhận Radar Chart hiển thị đồng thời hai bài hát.
- Hoàn thiện kiểm tra giao diện desktop.
- Kiểm thử giao diện mobile.
- Thực hiện regression test sau khi xử lý các lỗi còn mở.

### 7.3. Đánh giá chung

Với 22/28 test case đạt yêu cầu, tương đương 78,57%, phần lớn các chức năng được lựa chọn để kiểm thử đã hoạt động theo kết quả ghi nhận.

Tuy nhiên, hệ thống vẫn còn 1 test case FAIL, 2 test case PARTIAL, 2 test case cần xác minh và 1 test case chưa được kiểm thử.

Vì vậy, chưa đủ cơ sở để kết luận toàn bộ hệ thống đã hoàn tất QA hoặc sẵn sàng nghiệm thu cuối cùng.

---

## 8. Đề xuất hướng xử lý

Để hoàn thiện quá trình QA, nhóm cần thực hiện các công việc sau:

1. Kiểm tra dữ liệu và cách xếp hạng Popularity trong Top 10.
2. Xác minh cấu hình và kết quả của Calm và Chill Mood.
3. Kiểm tra dữ liệu và cơ chế loại trùng trong Taste Profile.
4. Kiểm thử trực tiếp Radar Chart khi so sánh hai bài hát.
5. Hoàn thiện kiểm tra bố cục desktop và kiểm thử giao diện mobile.
6. Thực hiện regression test sau khi sửa các lỗi còn tồn tại.
7. Cập nhật lại Test Plan, Bug Log và QA Report khi có kết quả kiểm thử mới.

---

## 9. Kết luận

Trong quá trình thực hiện Task 4.2 – Testing & QA, tôi đã kiểm thử các chức năng chính của EmBeat AI, tập trung vào Frontend, tích hợp API và trải nghiệm người dùng.

Test Plan hiện tại gồm 28 test case, trong đó có 22 trường hợp đạt yêu cầu, 2 trường hợp hoạt động một phần, 1 trường hợp không đạt, 2 trường hợp cần xác minh và 1 trường hợp chưa được kiểm thử.

Quá trình QA đã giúp phát hiện các vấn đề liên quan đến môi trường chạy, hiển thị ảnh bìa, dữ liệu Popularity, kết quả Mood và Taste Profile. Một số lỗi đã được xử lý, trong khi những vấn đề liên quan đến dữ liệu và thuật toán cần được tiếp tục xác minh.

Nhìn chung, EmBeat AI đã có thể thực hiện các luồng chính phục vụ demo. Tuy nhiên, nhóm vẫn cần hoàn thiện các nội dung kiểm thử còn lại và xử lý các lỗi chưa đóng trước khi nghiệm thu cuối cùng.

---

## 10. Tài liệu liên quan

- `docs/test_plan.md` – Danh sách 28 test case và kết quả kiểm thử.
- `docs/bug_log.md` – Nhật ký lỗi và trạng thái xử lý.
- `docs/api_contract.md` – Đặc tả API.
- `frontend/app.js` – Logic Frontend và tích hợp API.
- `frontend/index.html` – Cấu trúc giao diện.
- `frontend/style.css` – Giao diện và bố cục.
- `backend/tests/test_api.py` – Kiểm thử API Backend.
- `README.md` – Hướng dẫn sử dụng dự án.

---