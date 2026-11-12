# TEST PLAN – EMBEAT AI MUSIC RECOMMENDER

## 1. Thông tin chung

| Mục | Nội dung |
|---|---|
| Dự án | EmBeat AI – Music Recommender |
| Tài liệu | Test Plan |
| Công việc | Task 4.2 – Testing & QA |
| Phạm vi | Frontend, API Integration, Recommendation, UI/UX |
| Môi trường | Windows, Microsoft Edge, VS Code Live Server |
| Frontend | `http://127.0.0.1:5500/frontend/index.html` |
| Backend | `http://127.0.0.1:8000` |
| API Documentation | `http://127.0.0.1:8000/docs` |
| Ngày tổng hợp | 13/11/2026 |

## 2. Mục tiêu kiểm thử

Kiểm tra các chức năng chính của EmBeat AI, bao gồm:

- Tìm kiếm bài hát theo từ khóa.
- Hiển thị danh sách bài hát phổ biến Top 10.
- Gợi ý bài hát tương tự bằng AI.
- Gợi ý theo tâm trạng (Mood Recommendation).
- Gợi ý theo sở thích cá nhân (Taste Profile).
- Phát nhạc qua Spotify Embed.
- Quản lý thư viện yêu thích.
- Vẽ biểu đồ phân tích và so sánh đặc trưng âm nhạc Radar.
- Xử lý mượt mà trạng thái Loading, Empty và Error.
- Kiểm tra khả năng hiển thị và tương tác giao diện.

## 3. Phương pháp kiểm thử

**Functional Testing:** Kiểm tra chức năng dựa trên thao tác người dùng và kết quả mong đợi.

**API Testing:** Kiểm tra dữ liệu trả về từ Backend bằng trình duyệt và Swagger UI.

**UI Testing:** Kiểm tra giao diện, danh sách bài hát, ảnh bìa, các nút thao tác và bố cục.

**Negative Testing:** Kiểm tra tìm kiếm không có kết quả, Backend mất kết nối và các trường hợp dữ liệu không hợp lệ.

**Integration Testing:** Kiểm tra luồng dữ liệu từ Frontend đến Backend và dịch vụ Spotify.

**Regression Testing:** Kiểm tra lại chức năng sau khi sửa lỗi.

## 4. Test Cases

### A. Backend và API

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-01 | Kiểm tra Backend Health | API trả `status: ok`, model được tải thành công | PASS |
| TC-02 | Kiểm tra Popular Top 10 | Trả về 10 bài hát và hiển thị đầy đủ | PASS |
| TC-03 | Kiểm tra API Search | Tìm kiếm trả về dữ liệu phù hợp từ Backend | PASS |
| TC-04 | Kiểm tra API Recommend Track | Trả về danh sách bài hát tương tự | PASS |
| TC-05 | Kiểm tra API Recommend Mood | Các mood trả về kết quả phù hợp | PARTIAL |
| TC-06 | Kiểm tra API Taste Profile | Nhận nhiều `track_id` và trả về danh sách đề xuất | PARTIAL |
| TC-07 | Kiểm tra API khi tham số không hợp lệ | Backend trả mã lỗi và thông báo phù hợp | NOT TESTED |

### B. Search và Popular Songs

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-08 | Tìm kiếm theo tên nghệ sĩ | Trả về bài hát liên quan đến nghệ sĩ | PASS |
| TC-09 | Tìm kiếm theo tên bài hát | Trả về bài hát phù hợp | NOT TESTED |
| TC-10 | Tìm kiếm từ khóa không tồn tại | Hiển thị thông báo không tìm thấy | PASS |
| TC-11 | Kiểm tra giới hạn kết quả Search | Danh sách không vượt quá giới hạn API | PASS |
| TC-12 | Kiểm tra Top 10 Popular | Hiển thị đủ 10 bài, đúng thứ tự | PASS |
| TC-13 | Kiểm tra giá trị Popularity | Dữ liệu hiển thị đúng API, ranking cần xác minh | NEEDS VERIFICATION |

### C. AI Recommendation

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-14 | Gợi ý AI từ một bài hát | Hiển thị 10 bài tương tự | PASS |
| TC-15 | Hiển thị Similarity/Match | Có điểm tương đồng cho từng bài | PASS |
| TC-16 | Chuyển từ bài gốc sang danh sách gợi ý | Danh sách được cập nhật đúng | PASS |
| TC-17 | Kiểm tra kết quả trùng bài | Không lặp cùng một bản nhạc trong Top 10 | NOT TESTED |
| TC-18 | Kiểm tra thao tác cuộn khi gợi ý | Người dùng dễ tiếp cận danh sách kết quả | NEEDS VERIFICATION |

### D. Mood Recommendation

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-19 | Chọn Happy | Trả về 10 bài theo mood Happy | PASS |
| TC-20 | Chọn Sad | Trả về danh sách theo mood Sad | NOT TESTED |
| TC-21 | Chọn Calm | Trả về danh sách theo mood Calm | PARTIAL |
| TC-22 | Chọn Chill | Trả về danh sách theo mood Chill | PARTIAL |
| TC-23 | Chọn Energetic | Trả về danh sách theo mood Energetic | NOT TESTED |
| TC-24 | Chọn Focus | Trả về danh sách theo mood Focus | NOT TESTED |
| TC-25 | So sánh Calm và Chill | Hai mood được xử lý theo cấu hình phù hợp | NEEDS VERIFICATION |

**Ghi nhận:** Calm và Chill trả về cùng 10 bài hát, cùng thứ tự và điểm tương đồng. Cần Backend/AI xác minh.

### E. Spotify Player

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-26 | Nhấn Nghe một bài hát | Spotify Embed hiển thị và phát được nhạc | PASS |
| TC-27 | Chuyển sang bài khác | Now Playing cập nhật đúng bài được chọn | NOT TESTED |
| TC-28 | Kiểm tra ảnh bìa Now Playing | Hiển thị ảnh bìa bài hát | PASS |
| TC-29 | Kiểm tra Spotify Embed bị giới hạn phát | Giao diện không bị lỗi khi Spotify hạn chế phát | PARTIAL |
| TC-30 | Kiểm tra bài không có Spotify Embed | Hiển thị trạng thái thay thế phù hợp | NOT TESTED |

### F. Favorites và Taste Profile

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-31 | Thêm bài hát yêu thích | Bài hát xuất hiện trong thư viện | PASS |
| TC-32 | Hiển thị danh sách Favorites | Đúng bài hát, nghệ sĩ, ảnh bìa | PASS |
| TC-33 | Xóa một bài khỏi Favorites | Bài hát được xóa khỏi danh sách | NOT TESTED |
| TC-34 | Xóa toàn bộ Favorites | Danh sách trở về trạng thái rỗng | NOT TESTED |
| TC-35 | Reload trang sau khi lưu Favorites | Dữ liệu vẫn được lưu | NOT TESTED |
| TC-36 | Tạo Taste Profile từ nhiều bài | Backend tạo và hiển thị 10 bài đề xuất | PASS |
| TC-37 | Kiểm tra Taste Profile trùng bài | Không lặp cùng một bản nhạc trong kết quả | FAIL |
| TC-38 | Tạo Taste Profile khi chưa có Favorites | Hiển thị hướng dẫn hoặc thông báo phù hợp | NOT TESTED |

### G. Radar Chart và Music Analysis

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-39 | Mở chức năng So sánh | Chuyển đến giao diện phân tích | PASS |
| TC-40 | Hiển thị Radar Chart | Biểu đồ hiển thị hai bài hát | PASS |
| TC-41 | Hiển thị 9 đặc trưng âm nhạc | Có đầy đủ các thông số | PASS |
| TC-42 | Phân biệt hai bài bằng màu sắc | Hai bộ dữ liệu có màu và chú thích riêng | PASS |
| TC-43 | Kiểm tra đơn vị Tempo và Loudness | Hiển thị BPM và dB | PASS |
| TC-44 | Đối chiếu giá trị Radar với API | Giá trị trên giao diện khớp Backend | NOT TESTED |

### H. Loading, Empty và Error States

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-45 | Giả lập mạng chậm | Hiển thị trạng thái đang tải | PASS |
| TC-46 | Search không có kết quả | Hiển thị Empty State | PASS |
| TC-47 | Tắt Backend rồi tìm kiếm | Hiển thị thông báo lỗi kết nối | PASS |
| TC-48 | Backend hoạt động trở lại | Frontend kết nối lại và tiếp tục hoạt động | PASS |
| TC-49 | Kiểm tra trạng thái lỗi trên các API khác | Có thông báo lỗi phù hợp | NOT TESTED |

### I. UI/UX và Responsive

| ID | Test case | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-50 | Kiểm tra ảnh bìa danh sách | Ảnh hiển thị đúng, không bị lỗi | PASS |
| TC-51 | Kiểm tra bố cục Now Playing | Không che các nút thao tác | PASS sau sửa |
| TC-52 | Kiểm tra giao diện desktop | Không tràn, chồng lấp thành phần | PARTIAL |
| TC-53 | Kiểm tra giao diện tablet | Bố cục tự điều chỉnh phù hợp | NOT TESTED |
| TC-54 | Kiểm tra giao diện mobile | Không tràn ngang, thao tác được | NOT TESTED |
| TC-55 | Kiểm tra trạng thái active menu | Menu hiển thị đúng trang đang chọn | NOT TESTED |
| TC-56 | Kiểm tra thông báo Toast | Thông báo xuất hiện và không che nội dung quan trọng | PARTIAL |
| TC-57 | Kiểm tra bàn phím và focus | Có thể thao tác bằng bàn phím | NOT TESTED |

## 5. Tổng hợp kết quả

| Trạng thái | Số lượng |
|---|---:|
| PASS | 29 |
| PASS sau sửa | 1 |
| PARTIAL | 6 |
| FAIL | 1 |
| NEEDS VERIFICATION | 3 |
| NOT TESTED | 17 |
| **Tổng cộng** | **57** |

*Lưu ý: PASS phản ánh những hành vi đã quan sát được trong quá trình kiểm thử, không có nghĩa toàn bộ logic nội bộ đã được xác minh. Các trường hợp cần kiểm tra thêm không được tính là PASS.*

## 6. Các vấn đề cần theo dõi

| Bug ID | Vấn đề | Phụ trách đề xuất |
|---|---|---|
| BUG-002 | Top 10 có cùng Popularity 82 | Backend/Data |
| BUG-005 | Calm và Chill trả về danh sách giống hệt nhau | Backend/AI |
| BUG-006 | Taste Profile có hai bản ghi cùng bài hát | Backend/Data/AI |

Các lỗi ảnh bìa và bố cục Now Playing đã được sửa và kiểm tra lại.

## 7. Đánh giá

Frontend đã hoạt động đối với các luồng chính gồm Search, Top 10, AI Recommendation, Spotify Player, Favorites, Taste Profile, Radar Chart và xử lý Loading/Empty/Error.

Các vấn đề còn lại tập trung vào tính hợp lý của dữ liệu đề xuất và logic xử lý ở Backend/AI. Một số trường hợp về responsive, thao tác thư viện và dữ liệu biên chưa được kiểm thử.

## 8. Kết luận

Task 4.2 đã có kết quả kiểm thử thực tế cho các chức năng chính và danh sách các trường hợp cần kiểm tra bổ sung.

Trước khi nghiệm thu cuối cùng, nhóm cần xác minh các vấn đề còn mở, thực hiện regression test sau khi sửa và cập nhật lại trạng thái trong tài liệu.