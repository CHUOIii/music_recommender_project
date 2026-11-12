# TEST PLAN – EMBEAT AI MUSIC RECOMMENDER

## 1. Thông tin chung

| Mục | Nội dung |
|---|---|
| Dự án | EmBeat AI – Music Recommender |
| Tài liệu | Test Plan |
| Công việc | Task 4.2 – Testing & QA |
| Người thực hiện | Lê Thiện Chí – Frontend & QA |
| Phạm vi | Frontend, API Integration, Recommendation, UI/UX |
| Môi trường | Windows, Microsoft Edge, VS Code Live Server |
| Frontend | `http://127.0.0.1:5500/frontend/index.html` |
| Backend | `http://127.0.0.1:8000` |
| API Documentation | `http://127.0.0.1:8000/docs` |
| Ngày tổng hợp | 13/11/2026 |

---

## 2. Mục tiêu kiểm thử

Kiểm tra các chức năng chính của EmBeat AI nhằm đảm bảo Frontend hoạt động và tích hợp đúng với Backend.

Các nội dung kiểm thử gồm:

- Kết nối Backend và gọi API.
- Hiển thị Top 10 Popular.
- Tìm kiếm bài hát.
- Gợi ý AI theo bài hát.
- Gợi ý theo tâm trạng.
- Gợi ý theo danh sách yêu thích.
- Thêm và quản lý Favorites.
- Phát nhạc bằng Spotify Embed.
- Phân tích đặc trưng âm nhạc bằng Radar Chart.
- Xử lý trạng thái Loading, Empty và Error.
- Kiểm tra giao diện và khả năng tương tác.

Việc kiểm thử tập trung vào các chức năng đã được triển khai trong phiên bản Frontend hiện tại.

---

## 3. Phương pháp kiểm thử

**Functional Testing:** Thao tác trực tiếp trên giao diện để kiểm tra kết quả thực tế.

**API Integration Testing:** Kiểm tra Frontend có gửi yêu cầu đến đúng API và nhận dữ liệu từ Backend.

**UI Testing:** Kiểm tra danh sách bài hát, ảnh bìa, biểu đồ, nút thao tác và bố cục.

**Negative Testing:** Kiểm tra trường hợp không có kết quả hoặc Backend mất kết nối.

**Regression Testing:** Kiểm tra lại các chức năng liên quan sau khi sửa lỗi.

### Quy ước trạng thái

| Trạng thái | Ý nghĩa |
|---|---|
| PASS | Đã kiểm thử và đạt kết quả mong đợi |
| PARTIAL | Chức năng hoạt động nhưng còn vấn đề |
| FAIL | Đã kiểm thử và không đạt kết quả mong đợi |
| NEEDS VERIFICATION | Có dữ liệu hoặc dấu hiệu cần xác minh thêm |
| NOT TESTED | Chưa thực hiện kiểm thử thực tế |

---

## 4. Danh sách Test Case

### A. Backend, Search và Popular

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-01 | Kiểm tra Backend Health | API trả về `status: ok`, mô hình được nạp | PASS |
| TC-02 | Hiển thị Top 10 Popular | Hiển thị danh sách 10 bài hát từ API | PASS |
| TC-03 | Kiểm tra Popularity | Dữ liệu và thứ tự xếp hạng hợp lý | NEEDS VERIFICATION |
| TC-04 | Tìm kiếm theo nghệ sĩ | Trả về các bài hát liên quan đến nghệ sĩ | PASS |
| TC-05 | Tìm kiếm không có kết quả | Hiển thị thông báo không tìm thấy bài hát | PASS |
| TC-06 | Kiểm tra giới hạn Search | Số kết quả không vượt quá giới hạn yêu cầu | PASS |

**Kết quả ghi nhận:**

- Backend đã trả về `status: ok` và `model_loaded: true`.
- Số bài hát được nạp trong lần kiểm thử là 29.985.
- Tìm kiếm Taylor Swift trả về danh sách kết quả.
- Tìm kiếm từ khóa không tồn tại hiển thị Empty State.
- Top 10 hiển thị đủ bài hát, nhưng các bài từng có cùng giá trị Popularity 82.

**Vấn đề liên quan:** BUG-002.

### B. AI Recommendation và Mood

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-07 | Gợi ý AI theo bài hát | Trả về danh sách bài hát tương tự | PASS |
| TC-08 | Hiển thị Similarity/Match | Hiển thị điểm tương đồng từ kết quả API | PASS |
| TC-09 | Gợi ý theo Happy Mood | Hiển thị danh sách gợi ý từ Mood API | PASS |
| TC-10 | Kiểm tra Calm và Chill | Hai Mood được xử lý theo cấu hình tương ứng | PARTIAL |
| TC-11 | Kiểm tra các Mood còn lại | Sad, Energetic và Focus trả về kết quả | PASS |

**Kết quả ghi nhận:**

- Frontend đã gọi API gợi ý theo bài hát.
- Danh sách đề xuất và điểm tương đồng được hiển thị.
- Happy, Sad, Energetic và Focus Mood đã được kiểm thử.
- Calm và Chill từng trả về cùng 10 bài hát, cùng thứ tự và điểm tương đồng.

**Vấn đề liên quan:** BUG-005.

### C. Favorites và Taste Profile

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-12 | Tạo Taste Profile | Gửi nhiều Track ID lên Backend và nhận đề xuất | PASS |
| TC-13 | Kiểm tra bài trùng trong Profile | Không xuất hiện cùng một bản nhạc nhiều lần | FAIL |
| TC-14 | Thêm bài hát yêu thích | Bài hát được thêm vào Favorites | PASS |
| TC-15 | Hiển thị Favorites | Danh sách hiển thị bài hát đã lưu | PASS |
| TC-16 | Xóa bài hát yêu thích | Bài hát được xóa khỏi Favorites | PASS |
| TC-17 | Kiểm tra lưu Favorites | Dữ liệu vẫn còn sau khi tải lại trang | PASS |
| TC-18 | Xóa toàn bộ Favorites | Danh sách trở về trạng thái rỗng | PASS |

**Kết quả ghi nhận:**

- Frontend có chức năng lưu Favorites bằng `localStorage`.
- Taste Profile gửi danh sách Track ID lên API `/api/v1/recommend/profile`.
- Kết quả Profile đã hiển thị danh sách bài hát đề xuất.
- Trong một lần kiểm thử, bài hát có cùng tên và nghệ sĩ xuất hiện với hai Track ID khác nhau.
- Các thao tác xóa Favorites và kiểm tra dữ liệu sau khi tải lại trang trả về kết quả tương ứng.

**Vấn đề liên quan:** BUG-006.

### D. Spotify Player và Radar Chart

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-19 | Phát nhạc bằng Spotify Embed | Trình phát xuất hiện và phát được nhạc | PASS |
| TC-20 | Hiển thị ảnh bìa | Ảnh bìa danh sách và Now Playing hiển thị | PASS |
| TC-21 | Hiển thị đặc trưng âm học | Có đủ 9 thông số âm nhạc | PASS |
| TC-22 | So sánh hai bài trên Radar Chart | Hiển thị hai bộ dữ liệu trên cùng biểu đồ | NEEDS VERIFICATION |
| TC-23 | Bài hát không có Spotify Embed | Giao diện xử lý trường hợp thiếu Embed | PASS |

**Kết quả ghi nhận:**

- Spotify Embed đã được kiểm tra và hoạt động.
- Lỗi ảnh bìa từng xuất hiện và đã được sửa.
- Radar Chart đã hiển thị các đặc trưng âm học.
- Phiên bản Frontend mới có logic hỗ trợ hai bộ dữ liệu Radar, nhưng cần xác nhận lại thao tác so sánh trực tiếp trên trình duyệt.
- Trường hợp bài hát không có Spotify Embed trả về không tìm thấy bài hát.

**Vấn đề liên quan:** BUG-003 và BUG-004 đã được xử lý.

### E. Loading, Error và giao diện

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-24 | Giả lập mạng chậm | Hiển thị trạng thái Loading | PASS |
| TC-25 | Tắt Backend khi tìm kiếm | Hiển thị thông báo lỗi kết nối | PASS |
| TC-26 | Khởi động lại Backend | Frontend tiếp tục kết nối và hoạt động | PASS |
| TC-27 | Kiểm tra giao diện desktop | Bố cục và thao tác hiển thị phù hợp | PARTIAL |
| TC-28 | Kiểm tra giao diện mobile | Không tràn ngang, thao tác sử dụng được | NOT TESTED |

**Kết quả ghi nhận:**

- Loading State đã được kiểm tra bằng chế độ mạng chậm.
- Frontend hiển thị thông báo lỗi khi Backend không hoạt động.
- Frontend tiếp tục kết nối được sau khi Backend được khởi động lại.
- Bố cục Now Playing từng được chỉnh sửa để tránh che các nút thao tác.
- Chưa hoàn tất đánh giá giao diện trên nhiều kích thước màn hình.

---

## 5. Tổng hợp kết quả

| Trạng thái | Số lượng |
|---|---:|
| PASS | 22 |
| PARTIAL | 2 |
| FAIL | 1 |
| NEEDS VERIFICATION | 2 |
| NOT TESTED | 1 |
| **Tổng cộng** | **28** |

### Nhận xét

Trong 28 test case được lựa chọn:

- 22 test case đã đạt kết quả mong đợi.
- 2 test case hoạt động một phần nhưng còn vấn đề.
- 1 test case không đạt yêu cầu.
- 2 test case cần xác minh thêm.
- 1 test case chưa được kiểm thử.


---

## 6. Tổng hợp lỗi

| Bug ID | Mô tả | Tình trạng |
|---|---|---|
| BUG-001 | Python không tương thích với NumPy | Đã xử lý bằng Python 3.12 |
| BUG-002 | Top 10 có cùng Popularity 82 | Cần xác minh |
| BUG-003 | Ảnh bìa danh sách không hiển thị | Đã sửa |
| BUG-004 | Ảnh bìa Now Playing không hiển thị | Đã sửa |
| BUG-005 | Calm và Chill trả về cùng danh sách | Cần xác minh |
| BUG-006 | Taste Profile có bài hát trùng tên, khác Track ID | Chưa xử lý dứt điểm |

Các vấn đề liên quan đến dữ liệu và kết quả AI cần được nhóm Backend/AI xác minh thêm trước khi kết luận nguyên nhân.

---

## 7. Đánh giá

### Những phần đã hoạt động

- Kết nối Frontend với Backend.
- Tìm kiếm bài hát.
- Hiển thị Top 10 Popular.
- Gợi ý bài hát tương tự.
- Gợi ý theo Happy Mood.
- Tạo Taste Profile từ Favorites.
- Phát nhạc bằng Spotify Embed.
- Hiển thị ảnh bìa và đặc trưng âm học.
- Xử lý Loading, Empty và Error.

### Những phần cần hoàn thiện

- Kiểm tra Popularity và cách xếp hạng Top 10.
- Xác minh kết quả Calm và Chill.
- Xử lý trường hợp bài hát trùng trong Taste Profile.
- Xác nhận Radar Chart hiển thị đồng thời hai bài.
- Kiểm tra giao diện mobile.
- Thực hiện regression test sau khi sửa lỗi.

---

## 8. Kết luận

Trong quá trình thực hiện Task 4.2 – Testing & QA, tôi đã kiểm thử các chức năng chính của EmBeat AI, tập trung vào Frontend, tích hợp API và trải nghiệm người dùng.

Test Plan gồm 28 test case được lựa chọn dựa trên các chức năng thực tế của dự án và những kết quả kiểm thử đã ghi nhận.

Kết quả cho thấy hệ thống đã có thể thực hiện các luồng chính phục vụ demo. Tuy nhiên, vẫn còn một số vấn đề liên quan đến dữ liệu đề xuất, kết quả Mood và Taste Profile cần tiếp tục kiểm tra.

Các test case chưa thực hiện hoặc chưa xác minh được giữ nguyên trạng thái để nhóm tiếp tục theo dõi, thay vì đánh dấu hoàn thành khi chưa có kết quả thực tế.

Trước khi nghiệm thu cuối cùng, nhóm cần xử lý các lỗi còn mở, kiểm thử bổ sung và cập nhật lại tài liệu QA.

---

## 9. Tài liệu liên quan

- `docs/bug_log.md` – Nhật ký lỗi.
- `docs/api_contract.md` – Đặc tả API.
- `frontend/app.js` – Logic Frontend và tích hợp API.
- `frontend/index.html` – Cấu trúc giao diện.
- `frontend/style.css` – Giao diện và bố cục.
- `backend/tests/test_api.py` – Kiểm thử API Backend.
- `README.md` – Hướng dẫn sử dụng dự án.

---
