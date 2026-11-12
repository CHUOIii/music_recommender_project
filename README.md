EmBeat AI — Music Recommender System
EmBeat AI là dự án gợi ý âm nhạc sử dụng Machine Learning, FastAPI và giao diện web. Hệ thống tìm kiếm bài hát, đề xuất bài có đặc trưng âm học tương đồng, gợi ý theo tâm trạng và sở thích, đồng thời hỗ trợ nghe thử qua Spotify Embed.
Dự án tham khảo bộ dữ liệu `GD-Studio/embeat_45m_spotify_tracks` trên Hugging Face. 45M+ là quy mô nguồn dữ liệu, không phải số bài đang được nạp trong bản demo. Trong lần chạy thử đã ghi nhận mô hình nạp 29.985 bài hát; số lượng thực tế phụ thuộc artifact được sử dụng.
1. Chức năng chính
Top 10 phổ biến: gọi API `/api/v1/recommend/popular` khi vào trang chủ.
Tìm kiếm: tìm bài theo từ khóa qua `/api/v1/search`.
Gợi ý từ bài hát: chọn bài gốc, nhận danh sách đề xuất từ `/api/v1/recommend/track/{track_id}`.
Gợi ý theo tâm trạng: hỗ trợ `happy`, `sad`, `calm`, `chill`, `energetic`, `focus` qua `/api/v1/recommend/mood/{mood_name}`.
Gu âm nhạc (Taste Profile): lưu bài yêu thích ở `localStorage` và gửi danh sách ID lên `/api/v1/recommend/profile` để nhận gợi ý AI.
Spotify Embed: phát/nghe thử bài hát bằng khung nhúng Spotify (phụ thuộc khả năng phát do Spotify cung cấp).
Radar Chart: dùng Chart.js để so sánh đặc trưng âm học của bài gốc và bài được chọn so sánh.
Trạng thái giao diện: hiển thị đang tải, danh sách trống và lỗi kết nối/API.
2. Công nghệ
Thành phần	Công nghệ
Frontend	HTML5, Tailwind CSS (CDN), CSS, Vanilla JavaScript
Biểu đồ	Chart.js (CDN)
Nghe nhạc	Spotify Embed (`iframe`)
Backend	Python, FastAPI, Pydantic
Machine Learning	scikit-learn, NumPy; mô hình/metadata trong `artifacts/`
Xử lý dữ liệu	pandas, PyArrow; các script trong `src/`
Kiểm thử	Backend API tests và tài liệu QA trong `docs/`
3. Cấu trúc thư mục
```text
music_recommender_project/
├── artifacts/                  # Mô hình đã huấn luyện và metadata
├── backend/
│   ├── app.py                  # REST API FastAPI
│   ├── schemas.py              # Schema request/response
│   └── tests/test_api.py       # Kiểm thử Backend
├── data/processed/             # Dữ liệu đã xử lý, mẫu và báo cáo chất lượng
├── docs/
│   ├── api_contract.md         # Đặc tả API
│   ├── test_plan.md            # Kế hoạch/test case QA
│   ├── bug_log.md              # Nhật ký lỗi QA
│   ├── data_dictionary.md
│   ├── dataset_sources.md
│   └── HANDOFF_TO_ML_ENGINEER.md
├── frontend/
│   ├── index.html              # Giao diện
│   ├── style.css               # CSS bổ sung
│   └── app.js                  # Gọi API, tương tác, biểu đồ
├── notebooks/                  # EDA, tiền xử lý, huấn luyện, đánh giá
├── reports/                    # Kết quả đánh giá và hình minh họa
├── src/                        # Xử lý dữ liệu, train, evaluate, recommender
├── .env.example
├── music_recommender_project.md # Master Plan
├── requirements.txt
└── README.md
```
4. Hướng dẫn cài đặt và chạy
Yêu cầu
Windows và Python 3.12 (phiên bản đã sử dụng trong môi trường demo).
VS Code với tiện ích Live Server hoặc một HTTP server tĩnh tương đương.
Kết nối Internet để tải Tailwind CSS, Chart.js và Spotify Embed từ CDN.
Các file mô hình trong thư mục `artifacts/`.
Bước 1 — Cài thư viện
Mở terminal tại thư mục gốc `music_recommender_project`:
```powershell
py -3.12 -m pip install -r requirements.txt
```
Không cần sử dụng lại thư mục `venv` được tạo trên máy khác.
Bước 2 — Chạy Backend
```powershell
py -3.12 -m uvicorn backend.app:app --reload --port 8000
```
Kiểm tra:
Health check: http://127.0.0.1:8000/api/v1/health
Swagger API docs: http://127.0.0.1:8000/docs
Backend sẵn sàng phục vụ gợi ý khi health check trả về `status: "ok"` và `model_loaded: true`.
Bước 3 — Chạy Frontend
Mở thư mục dự án bằng VS Code, sau đó dùng Live Server để mở `frontend/index.html`.
Ví dụ nếu Live Server phục vụ từ thư mục gốc dự án:
```text
http://127.0.0.1:5500/frontend/index.html
```
Địa chỉ có thể khác tùy thư mục được mở trong VS Code. Frontend và Backend chạy ở hai cổng khác nhau là bình thường: ví dụ Frontend `5500`, Backend `8000`.
Trong `frontend/app.js`, địa chỉ API mặc định là `http://127.0.0.1:8000`. Nếu trước đây đã thiết lập `localStorage` với khóa `embeat_api_base`, giá trị đó có thể ghi đè địa chỉ mặc định; cần kiểm tra khi gặp lỗi kết nối.
5. Danh sách API
Phương thức	Endpoint	Mục đích
GET	`/api/v1/health`	Trạng thái Backend và model
GET	`/api/v1/search?q={keyword}&limit=15`	Tìm bài hát
GET	`/api/v1/tracks/{track_id}`	Chi tiết bài hát
GET	`/api/v1/recommend/track/{track_id}?k=10&strategy=hybrid`	Đề xuất theo bài gốc
GET	`/api/v1/recommend/popular?k=10`	Bài hát phổ biến
GET	`/api/v1/recommend/mood/{mood_name}?k=10`	Đề xuất theo tâm trạng
POST	`/api/v1/recommend/profile`	Đề xuất theo tập bài yêu thích
Ví dụ body của API Taste Profile:
```json
{
  "track_ids": ["spotify_track_id_1", "spotify_track_id_2"],
  "k": 10,
  "alpha": 0.7,
  "exclude_same_artist": false
}
```
Các giá trị `spotify_track_id_1`, `spotify_track_id_2` chỉ là chỗ giữ chỗ; khi sử dụng phải thay bằng ID thật từ kết quả tìm kiếm. Chi tiết tham số và response xem `docs/api_contract.md` và Swagger.
6. Đặc trưng âm học
Mô hình sử dụng 9 trường âm học:
Trường	Ý nghĩa
`danceability`	Mức độ phù hợp để nhảy
`energy`	Mức năng lượng/cường độ âm thanh
`valence`	Sắc thái cảm xúc tích cực của bài hát
`acousticness`	Mức độ âm học (acoustic)
`liveness`	Khả năng bản thu có yếu tố biểu diễn trực tiếp
`speechiness`	Mức độ chứa lời nói
`instrumentalness`	Khả năng bài hát thiên về nhạc không lời
`tempo`	Nhịp độ, đơn vị BPM
`loudness`	Độ lớn âm thanh, đơn vị dB
Khi hiển thị Radar Chart, các đặc trưng có thang đo khác nhau cần được chuẩn hóa để có thể so sánh trên cùng biểu đồ.
7. Kịch bản demo
Chạy Backend ở cổng `8000`, kiểm tra `/api/v1/health`.
Mở Frontend bằng Live Server và xem Top 10 Popular.
Tìm một bài hát, chọn Gợi ý AI để nhận danh sách đề xuất.
Chọn So sánh ở một bài được gợi ý để xem Radar Chart hai bài.
Chọn một trong sáu Mood được Backend hỗ trợ.
Thêm vài bài vào Gu âm nhạc, sau đó yêu cầu AI gợi ý theo Profile.
Thử phát bài hát qua Spotify Embed.
8. Kiểm thử và tài liệu QA
`docs/test_plan.md`: test case và kế hoạch kiểm thử.
`docs/bug_log.md`: các lỗi đã ghi nhận và trạng thái xử lý.
`backend/tests/test_api.py`: kiểm thử API Backend.
Hai tài liệu QA đã có trong bản dự án gốc. Khi tích hợp Frontend mới, cần cập nhật kết quả kiểm thử và lỗi phát sinh thay vì mặc định mọi test cũ vẫn còn PASS.
Một số hiện tượng từng được ghi nhận khi kiểm thử tích hợp: kết quả Mood `calm`/`chill` trùng nhau và một tên bài hát xuất hiện nhiều lần trong gợi ý Profile với các track ID khác nhau. Cần xác minh ở Backend/dữ liệu trước khi kết luận nguyên nhân.
9. Hạn chế và lưu ý
Mô hình demo sử dụng tập dữ liệu đã nạp, không tìm kiếm trực tiếp trên toàn bộ 45 triệu bài hát.
Kết quả Spotify Embed phụ thuộc kết nối mạng và chính sách của Spotify.
Danh sách yêu thích lưu bằng `localStorage` của trình duyệt hiện tại, không đồng bộ tài khoản giữa các thiết bị.
Không khẳng định hệ thống đã đạt độ chính xác cụ thể nếu không có số liệu đánh giá tương ứng. Kết quả đánh giá mô hình nằm trong `reports/metrics.json` và các file `evaluation_*`.
Chạy bằng CDN và Live Server phù hợp demo/học tập; không phải hướng dẫn triển khai production.
10. Tài liệu liên quan
`music_recommender_project.md` — kế hoạch tổng thể, phân công và kiến trúc.
`docs/api_contract.md` — hợp đồng API giữa Frontend và Backend.
`docs/data_dictionary.md` — từ điển dữ liệu.
`docs/test_plan.md`, `docs/bug_log.md` — tài liệu QA.
`backend/README.md` — hướng dẫn riêng cho Backend.
`reports/metrics.json` — số liệu đánh giá mô hình.
---