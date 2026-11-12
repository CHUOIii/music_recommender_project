# BUG LOG – EMBEAT AI MUSIC RECOMMENDER

## 1. Thông tin chung

| Mục | Nội dung |
|---|---|
| Dự án | EmBeat AI – Music Recommender |
| Tài liệu | Bug Log |
| Công việc | Task 4.2 – Testing & QA |
| Ngày tổng hợp | 13/11/2026 |
| Môi trường | Windows, Microsoft Edge, Python 3.12, FastAPI, Live Server |

## 2. Quy ước

**Severity**

- Critical: Chức năng chính không thể sử dụng hoặc hệ thống ngừng hoạt động.
- High: Chức năng quan trọng bị ảnh hưởng đáng kể.
- Medium: Chức năng vẫn hoạt động nhưng kết quả hoặc trải nghiệm chưa đạt yêu cầu.
- Low: Lỗi nhỏ về giao diện hoặc thông tin hiển thị.

**Status**

- Fixed: Đã sửa và kiểm tra lại.
- Open: Đã xác nhận vấn đề, chưa xử lý.
- Needs Verification: Cần xác minh thêm trước khi kết luận lỗi.
- Monitoring: Đang theo dõi, chưa xác định là lỗi sản phẩm.

## 3. Danh sách Bug

| ID | Mô tả | Severity | Status | Phụ trách đề xuất |
|---|---|---|---|---|
| BUG-001 | Backend không chạy do thiếu thư viện trong môi trường Python | High | Fixed | Setup/Integration |
| BUG-002 | 10 bài Popular đều có Popularity bằng 82 | Low | Needs Verification | Backend/Data |
| BUG-003 | Ảnh bìa trong danh sách bài hát không hiển thị | Medium | Fixed | Frontend |
| BUG-004 | Now Playing không hiển thị ảnh bìa bài hát | Low | Fixed | Frontend |
| BUG-005 | Calm và Chill trả về cùng danh sách đề xuất | Medium | Open | Backend/AI |
| BUG-006 | Taste Profile đề xuất trùng cùng một bài hát | Medium | Open | Backend/Data/AI |
| BUG-007 | Now Playing che các nút thao tác trong danh sách | Medium | Fixed | Frontend |

## 4. Chi tiết Bug

### BUG-001 – Backend không khởi động do môi trường Python

**Severity:** High  
**Status:** Fixed  
**Module:** Backend Setup / Environment

**Mô tả:** Backend không thể khởi động do môi trường Python đang sử dụng chưa có đầy đủ thư viện cần thiết.

**Cách tái hiện:**
1. Chạy Backend bằng môi trường Python chưa cài đủ dependencies.
2. Quan sát lỗi import thư viện, bao gồm NumPy.

**Kết quả thực tế:** Backend không khởi động thành công.

**Kết quả mong đợi:** Backend khởi động và tải được mô hình AI.

**Cách khắc phục đã thực hiện:**
- Sử dụng Python 3.12.
- Cài các thư viện theo `requirements.txt`.
- Chạy Backend bằng đúng phiên bản Python.

**Kiểm tra lại:** API Health trả về `status: ok`, `model_loaded: true`, với 29.985 tracks.

**Kết luận:** Đã khắc phục lỗi môi trường. Đây không phải lỗi đã xác nhận trong thuật toán đề xuất.

---

### BUG-002 – Popularity của Top 10 đều bằng 82

**Severity:** Low  
**Status:** Needs Verification  
**Module:** Backend / Dataset

**Mô tả:** Danh sách 10 bài hát phổ biến hiển thị cùng giá trị Popularity là 82.

**Cách tái hiện:**
1. Mở EmBeat AI.
2. Xem danh sách Top 10 Popular.
3. Mở API `/api/v1/recommend/popular?k=10`.
4. Đối chiếu giá trị `popularity`.

**Kết quả thực tế:** API trả về giá trị Popularity 82 cho cả 10 bài; Frontend hiển thị đúng dữ liệu đó.

**Kết quả mong đợi:** Danh sách phản ánh đúng dữ liệu và quy tắc xếp hạng Popularity.

**Nhận định:** Đây chưa chắc là lỗi. Có thể nhiều bài cùng đạt Popularity 82 trong dataset. Cần xác minh thuật toán chọn Top 10 và dữ liệu nguồn.

**Đề xuất:** Backend/Data kiểm tra cách sắp xếp và xử lý các bài có cùng điểm Popularity.

---

### BUG-003 – Ảnh bìa trong danh sách không hiển thị

**Severity:** Medium  
**Status:** Fixed  
**Module:** Frontend

**Mô tả:** Một số thẻ bài hát ban đầu hiển thị chữ thay thế hoặc biểu tượng mặc định thay vì ảnh bìa.

**Kết quả thực tế trước khi sửa:** Ảnh bìa không hiển thị chính xác.

**Cách xử lý:** Sử dụng Spotify oEmbed để lấy ảnh bìa và cập nhật hàm hiển thị ảnh trong `app.js`.

**Kiểm tra lại:** Các bài hát trong danh sách Top 10 hiển thị ảnh bìa riêng, không còn lỗi quan sát được.

**Kết luận:** Fixed.

---

### BUG-004 – Now Playing không hiển thị ảnh bìa

**Severity:** Low  
**Status:** Fixed  
**Module:** Frontend

**Mô tả:** Khung Now Playing ban đầu chỉ hiển thị biểu tượng âm nhạc mặc định.

**Kết quả mong đợi:** Now Playing hiển thị ảnh bìa tương ứng với bài hát được chọn.

**Cách xử lý:** Bổ sung xử lý ảnh bìa từ Spotify cho khu vực Now Playing.

**Kiểm tra lại:** Ảnh bìa đã hiển thị trong khung Now Playing.

**Kết luận:** Fixed.

---

### BUG-005 – Calm và Chill trả về cùng danh sách đề xuất

**Severity:** Medium  
**Status:** Open  
**Module:** Backend / AI Recommendation

**Mô tả:** Hai tâm trạng Calm (Êm dịu) và Chill (Thư giãn) trả về cùng 10 bài hát, cùng thứ tự và cùng điểm tương đồng.

**Cách tái hiện:**
1. Gọi API `/api/v1/recommend/mood/calm?k=10`.
2. Gọi API `/api/v1/recommend/mood/chill?k=10`.
3. So sánh `track_id` và `similarity_score` của hai kết quả.

**Kết quả thực tế:**
- API trả về hai `mode` khác nhau: `mood_calm` và `mood_chill`.
- Danh sách 10 bài hát giống nhau.
- Thứ tự và điểm tương đồng giống nhau.

**Kết quả mong đợi:** Mỗi mood được xử lý theo cấu hình đã thiết kế và phản ánh đúng đặc điểm tâm trạng tương ứng.

**Phạm vi xác nhận:** Đã xác nhận hai API trả kết quả giống nhau. Chưa xác minh nguyên nhân nội bộ.

**Nguyên nhân cần kiểm tra:**
- Cấu hình đặc trưng âm học của Calm và Chill.
- Vector đại diện cho từng mood.
- Logic lọc và xếp hạng kết quả.
- Khả năng hai mood có cấu hình trùng nhau.

**Đề xuất:** Backend/AI kiểm tra cấu hình và thuật toán. Không sửa Frontend để tạo khác biệt giả.

**Kiểm thử lại sau khi sửa:** Gọi lại hai API, đối chiếu kết quả và kiểm tra chúng có phù hợp với thiết kế mood hay không.

---

### BUG-006 – Taste Profile đề xuất trùng bài hát

**Severity:** Medium  
**Status:** Open  
**Module:** Backend / Dataset / AI Recommendation

**Mô tả:** Trong danh sách 10 bài Taste Profile, bài `twilight zone – Ariana Grande` xuất hiện ở hai vị trí khác nhau.

**Cách tái hiện:**
1. Thêm 5 bài hát vào Favorites.
2. Nhấn “Gợi ý theo gu âm nhạc”.
3. Quan sát danh sách 10 bài được đề xuất.
4. Phát bài ở vị trí 03 và 05.
5. Gọi API `POST /api/v1/recommend/profile` với cùng 5 `track_id`.
6. Đối chiếu hai bản ghi `twilight zone`.

**Kết quả thực tế:**
- Cả hai vị trí đều hiển thị `twilight zone – Ariana Grande`.
- Người kiểm thử xác nhận hai vị trí phát cùng một bài nhạc.
- API trả về hai `track_id` khác nhau.
- Hai bản ghi có Popularity và Similarity khác nhau.

**Kết quả mong đợi:** Danh sách đề xuất không lặp lại cùng một bản nhạc thực tế, nếu yêu cầu sản phẩm là đề xuất các bài độc nhất.

**Nguyên nhân nghi vấn:** Dataset chứa nhiều bản ghi hoặc phiên bản của cùng một bài, và thuật toán chưa loại trùng theo định danh bài hát thực tế.

**Đề xuất:**
- Kiểm tra dữ liệu trùng trong dataset.
- Kiểm tra Spotify Track ID và phiên bản bài hát.
- Xem xét loại trùng trong danh sách đề xuất sau khi xếp hạng.
- Không chỉ dựa vào `track_id` nếu dữ liệu có nhiều bản ghi cho cùng bản nhạc.

**Kiểm thử lại sau khi sửa:** Tạo Taste Profile bằng cùng 5 bài yêu thích, kiểm tra Top 10 không còn lặp bản nhạc thực tế.

---

### BUG-007 – Now Playing che các nút thao tác

**Severity:** Medium  
**Status:** Fixed  
**Module:** Frontend / CSS

**Mô tả:** Khung Now Playing chồng lên khu vực danh sách bài hát, khiến một số nút thao tác bị che.

**Cách tái hiện:**
1. Mở trang Khám phá.
2. Chọn một mood để hiển thị danh sách đề xuất.
3. Quan sát khu vực tiếp giáp giữa danh sách và Now Playing.

**Kết quả thực tế trước khi sửa:** Khung Now Playing che một phần các nút trong danh sách.

**Kết quả mong đợi:** Hai cột được bố trí độc lập, không chồng lấp.

**Cách xử lý:** Điều chỉnh CSS giới hạn chiều rộng của `.result-layout`, `.track-list`, `.track` và `.player-panel`.

**Kiểm tra lại:** Người kiểm thử xác nhận các nút thao tác đã hiển thị đầy đủ sau khi cập nhật CSS.

**Kết luận:** Fixed.

## 5. Tổng hợp Bug

| Trạng thái | Số lượng |
|---|---:|
| Fixed | 4 |
| Open | 2 |
| Needs Verification | 1 |
| **Tổng cộng** | **7** |

## 6. Phân công xử lý đề xuất

**Frontend / QA**
- Duy trì các bản sửa ảnh bìa và bố cục Now Playing.
- Kiểm thử hồi quy sau khi Backend thay đổi.
- Cập nhật kết quả trong Test Plan và Bug Log.

**Backend / AI**
- Kiểm tra cấu hình Calm và Chill.
- Kiểm tra việc loại trùng trong Taste Profile.
- Xác minh quy tắc xếp hạng Popular Top 10.

## 7. Regression Testing

Sau khi các lỗi còn mở được xử lý, cần kiểm tra lại:

- Search và Popular Top 10.
- Recommend Track.
- Cả 6 mood.
- Taste Profile với cùng dữ liệu đầu vào đã phát hiện lỗi.
- Spotify Player và ảnh bìa.
- Radar Chart.
- Loading, Empty và Error.
- Bố cục desktop và responsive.

## 8. Kết luận

Đã ghi nhận 7 vấn đề trong quá trình triển khai và kiểm thử EmBeat AI.

Trong đó, 4 vấn đề đã được khắc phục và xác nhận lại; 2 vấn đề về kết quả đề xuất còn mở; 1 vấn đề về Popularity cần xác minh.

Frontend đã xử lý các lỗi giao diện quan sát được. Những vấn đề liên quan đến dữ liệu và thuật toán cần được chuyển cho thành viên Backend/AI kiểm tra trước khi nghiệm thu cuối cùng.