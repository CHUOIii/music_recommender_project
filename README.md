
# EmBeat AI — Music Recommender System

EmBeat AI là dự án gợi ý âm nhạc sử dụng Machine Learning, FastAPI và giao diện web. Hệ thống hỗ trợ tìm kiếm bài hát, đề xuất các bài có đặc trưng âm học tương đồng, gợi ý theo tâm trạng và sở thích cá nhân, đồng thời hỗ trợ nghe nhạc qua Spotify Embed.

Dự án tham khảo bộ dữ liệu `GD-Studio/embeat_45m_spotify_tracks` trên Hugging Face.

**Lưu ý:** 45M+ là quy mô nguồn dữ liệu, không phải số bài hát đang được nạp trong bản demo. Trong lần chạy thử, mô hình đã nạp **29.985 bài hát**. Số lượng thực tế phụ thuộc vào artifact được sử dụng.

---

## 1. Chức năng chính

- **Top 10 phổ biến:** Hiển thị danh sách bài hát phổ biến thông qua API `/api/v1/recommend/popular`.
- **Tìm kiếm bài hát:** Tìm kiếm theo tên bài hát hoặc từ khóa thông qua `/api/v1/search`.
- **Gợi ý theo bài hát:** Chọn một bài hát gốc và nhận danh sách bài hát tương đồng từ `/api/v1/recommend/track/{track_id}`.
- **Gợi ý theo tâm trạng:** Hỗ trợ 6 tâm trạng `happy`, `sad`, `calm`, `chill`, `energetic`, `focus` thông qua `/api/v1/recommend/mood/{mood_name}`.
- **Gu âm nhạc (Taste Profile):** Lưu danh sách bài hát yêu thích bằng `localStorage` và gửi danh sách ID đến `/api/v1/recommend/profile` để nhận gợi ý từ AI.
- **Spotify Embed:** Phát hoặc nghe thử bài hát bằng trình phát nhúng Spotify.
- **Radar Chart:** Sử dụng Chart.js để so sánh các đặc trưng âm học giữa bài hát gốc và bài hát được chọn.
- **Xử lý trạng thái:** Hiển thị trạng thái đang tải, không có dữ liệu và lỗi kết nối API.

---

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | HTML5, Tailwind CSS (CDN), CSS, Vanilla JavaScript |
| Biểu đồ | Chart.js (CDN) |
| Nghe nhạc | Spotify Embed (`iframe`) |
| Backend | Python, FastAPI, Pydantic |
| Machine Learning | scikit-learn, NumPy |
| Xử lý dữ liệu | pandas, PyArrow |
| Mô hình và metadata | Thư mục `artifacts/` |
| Kiểm thử | Backend API Tests và tài liệu QA trong `docs/` |

---

## 3. Cấu trúc thư mục

```text
music_recommender_project/
├── artifacts/                   # Mô hình đã huấn luyện và metadata
├── backend/
│   ├── app.py                   # REST API FastAPI
│   ├── schemas.py               # Schema request/response
│   └── tests/
│       └── test_api.py          # Kiểm thử Backend
├── data/
│   └── processed/               # Dữ liệu đã xử lý
├── docs/
│   ├── api_contract.md          # Đặc tả API
│   ├── test_plan.md             # Kế hoạch kiểm thử QA
│   ├── bug_log.md               # Nhật ký lỗi QA
│   ├── data_dictionary.md
│   ├── dataset_sources.md
│   └── HANDOFF_TO_ML_ENGINEER.md
├── frontend/
│   ├── index.html               # Giao diện website
│   ├── style.css                # CSS bổ sung
│   └── app.js                   # Gọi API và xử lý tương tác
├── notebooks/                   # EDA, tiền xử lý và huấn luyện
├── reports/                     # Kết quả đánh giá mô hình
├── src/                         # Xử lý dữ liệu và Machine Learning
├── .env.example
├── music_recommender_project.md # Master Plan
├── requirements.txt
└── README.md
```

---

## 4. Hướng dẫn cài đặt và chạy

### 4.1. Yêu cầu

- Hệ điều hành Windows.
- Python 3.12 (phiên bản đã sử dụng trong môi trường demo).
- VS Code và tiện ích Live Server hoặc một HTTP server tĩnh tương đương.
- Kết nối Internet để tải Tailwind CSS, Chart.js và Spotify Embed.
- Các file mô hình trong thư mục `artifacts/`.

### 4.2. Cài đặt thư viện

Mở Terminal tại thư mục gốc `music_recommender_project` và chạy:

```powershell
py -3.12 -m pip install -r requirements.txt
```

Không cần sử dụng lại thư mục môi trường ảo `venv` được tạo trên máy khác.

### 4.3. Khởi chạy Backend

Chạy lệnh:

```powershell
py -3.12 -m uvicorn backend.app:app --reload --port 8000
```

Sau khi Backend khởi động, kiểm tra các địa chỉ:

- **Health Check:** http://127.0.0.1:8000/api/v1/health
- **Swagger API Docs:** http://127.0.0.1:8000/docs

Backend sẵn sàng phục vụ gợi ý khi Health Check trả về:

```json
{
  "status": "ok",
  "model_loaded": true
}
```

Đây là các trường cần kiểm tra trong phản hồi; API có thể trả về thêm các trường khác.

### 4.4. Khởi chạy Frontend

1. Mở thư mục dự án bằng VS Code.
2. Truy cập thư mục `frontend/`.
3. Nhấp chuột phải vào `index.html`.
4. Chọn **Open with Live Server**.
5. Truy cập website trên trình duyệt.

Ví dụ, nếu Live Server phục vụ từ thư mục gốc dự án:

http://127.0.0.1:5500/frontend/index.html

**Lưu ý:**

- Frontend chạy ở cổng `5500`, Backend chạy ở cổng `8000`.
- Hai cổng khác nhau là bình thường và không gây xung đột.
- Địa chỉ Live Server có thể thay đổi tùy cấu hình.

Trong `frontend/app.js`, địa chỉ Backend mặc định là:

```javascript
http://127.0.0.1:8000
```

Nếu trước đây đã lưu khóa `embeat_api_base` trong `localStorage`, giá trị đó có thể ghi đè địa chỉ mặc định. Cần kiểm tra khi gặp lỗi kết nối.

---

## 5. Danh sách API

| Phương thức | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/v1/health` | Kiểm tra trạng thái Backend và mô hình |
| GET | `/api/v1/search?q={keyword}&limit=15` | Tìm kiếm bài hát |
| GET | `/api/v1/tracks/{track_id}` | Lấy thông tin chi tiết bài hát |
| GET | `/api/v1/recommend/track/{track_id}?k=10&strategy=hybrid` | Gợi ý theo bài hát gốc |
| GET | `/api/v1/recommend/popular?k=10` | Lấy danh sách bài hát phổ biến |
| GET | `/api/v1/recommend/mood/{mood_name}?k=10` | Gợi ý theo tâm trạng |
| POST | `/api/v1/recommend/profile` | Gợi ý theo danh sách bài hát yêu thích |

### Ví dụ API Taste Profile

**Endpoint:**

```http
POST /api/v1/recommend/profile
```

**Request Body:**

```json
{
  "track_ids": [
    "spotify_track_id_1",
    "spotify_track_id_2"
  ],
  "k": 10,
  "alpha": 0.7,
  "exclude_same_artist": false
}
```

Các giá trị `spotify_track_id_1` và `spotify_track_id_2` chỉ là ví dụ. Khi sử dụng cần thay bằng Track ID thực tế từ kết quả tìm kiếm.

Chi tiết tham số và dữ liệu trả về được mô tả tại:

- `docs/api_contract.md`
- Swagger UI: http://127.0.0.1:8000/docs

---

## 6. Đặc trưng âm học

Mô hình sử dụng 9 đặc trưng âm học để phân tích và so sánh các bài hát.

| Đặc trưng | Ý nghĩa |
|---|---|
| `danceability` | Mức độ phù hợp để nhảy |
| `energy` | Mức năng lượng và cường độ âm thanh |
| `valence` | Sắc thái cảm xúc tích cực của bài hát |
| `acousticness` | Mức độ âm học (acoustic) |
| `liveness` | Khả năng bản thu có yếu tố biểu diễn trực tiếp |
| `speechiness` | Mức độ chứa lời nói |
| `instrumentalness` | Khả năng bài hát thiên về nhạc không lời |
| `tempo` | Nhịp độ bài hát, đơn vị BPM |
| `loudness` | Độ lớn âm thanh, đơn vị dB |

### Radar Chart

Frontend sử dụng thư viện **Chart.js** để trực quan hóa các đặc trưng âm học.

Biểu đồ hỗ trợ:

- Hiển thị đặc trưng của bài hát gốc.
- Hiển thị đặc trưng của bài hát được chọn để so sánh.
- So sánh hai bài hát bằng hai bộ dữ liệu trên cùng một biểu đồ.

Do các đặc trưng có thang đo khác nhau, dữ liệu cần được chuẩn hóa để hiển thị và so sánh phù hợp.

---

## 7. Kịch bản demo

### Bước 1: Khởi chạy hệ thống

- Chạy Backend ở cổng `8000`.
- Kiểm tra API `/api/v1/health`.
- Mở Frontend bằng Live Server.

### Bước 2: Hiển thị Top 10 Popular

- Truy cập trang chủ.
- Hệ thống gọi API `/api/v1/recommend/popular`.
- Hiển thị danh sách bài hát phổ biến.

### Bước 3: Tìm kiếm và gợi ý bài hát

- Nhập tên bài hát vào ô tìm kiếm.
- Chọn một bài hát trong kết quả.
- Nhấn **Gợi ý AI**.
- Hệ thống gọi API `/api/v1/recommend/track/{track_id}`.
- Hiển thị danh sách bài hát được đề xuất.

### Bước 4: So sánh đặc trưng âm học

- Chọn **So sánh** tại một bài hát được gợi ý.
- Chuyển đến khu vực Radar Chart.
- Quan sát các đặc trưng âm học của hai bài hát.

### Bước 5: Gợi ý theo tâm trạng

Chọn một trong sáu tâm trạng:

- Happy
- Sad
- Calm
- Chill
- Energetic
- Focus

Hệ thống gọi API tương ứng để nhận danh sách gợi ý.

### Bước 6: Taste Profile

- Thêm một số bài hát vào danh sách yêu thích.
- Mở mục **Gu âm nhạc**.
- Yêu cầu AI tạo danh sách đề xuất.
- Frontend gửi danh sách Track ID lên `/api/v1/recommend/profile`.
- Hiển thị kết quả từ Backend.

### Bước 7: Spotify Player

- Chọn một bài hát.
- Mở Spotify Embed.
- Thử phát hoặc nghe trước bài hát nếu Spotify hỗ trợ.

---

## 8. Kiểm thử và tài liệu QA

Dự án có các tài liệu và bộ kiểm thử sau:

| Tài liệu | Mục đích |
|---|---|
| `docs/test_plan.md` | Kế hoạch và các trường hợp kiểm thử |
| `docs/bug_log.md` | Ghi nhận lỗi và trạng thái xử lý |
| `backend/tests/test_api.py` | Kiểm thử API Backend |

Hai tài liệu QA đã có trong bản dự án gốc và được cập nhật trong quá trình tích hợp Frontend.

### Các nội dung kiểm thử

- Kiểm tra kết nối Backend.
- Hiển thị Top 10 Popular.
- Tìm kiếm bài hát.
- Gợi ý AI theo bài hát.
- Gợi ý theo tâm trạng.
- Taste Profile.
- Spotify Embed.
- Radar Chart.
- Trạng thái Loading, Empty và Error.

### Một số vấn đề đã ghi nhận

Trong quá trình kiểm thử tích hợp, từng ghi nhận các hiện tượng:

- Mood `calm` và `chill` trả về danh sách bài hát trùng nhau.
- Một tên bài hát xuất hiện nhiều lần trong kết quả Taste Profile với các Track ID khác nhau.
- Một số kết quả Top 10 có cùng giá trị `popularity`.

Các hiện tượng này cần được kiểm tra thêm ở Backend hoặc dữ liệu trước khi kết luận nguyên nhân.

---

## 9. Hạn chế và lưu ý

- Mô hình demo chỉ sử dụng tập dữ liệu đã nạp, không tìm kiếm trực tiếp trên toàn bộ hơn 45 triệu bài hát.
- Spotify Embed phụ thuộc vào kết nối Internet và chính sách phát nhạc của Spotify.
- Danh sách yêu thích được lưu bằng `localStorage`, chưa đồng bộ giữa các thiết bị.
- Việc sử dụng Tailwind CSS và Chart.js qua CDN phù hợp với môi trường demo và học tập.
- Kết quả đánh giá mô hình cần dựa trên số liệu thực tế, không tự đưa ra độ chính xác khi chưa có kết quả kiểm chứng.

Các kết quả đánh giá mô hình được lưu trong:

- `reports/metrics.json`
- Các file đánh giá liên quan trong thư mục `reports/`.

---

## 10. Tài liệu liên quan

| Tài liệu | Nội dung |
|---|---|
| `music_recommender_project.md` | Master Plan, kiến trúc và phân công công việc |
| `docs/api_contract.md` | Đặc tả API |
| `docs/data_dictionary.md` | Từ điển dữ liệu |
| `docs/dataset_sources.md` | Thông tin nguồn dữ liệu |
| `docs/test_plan.md` | Kế hoạch kiểm thử |
| `docs/bug_log.md` | Nhật ký lỗi |
| `backend/README.md` | Hướng dẫn Backend |
| `reports/metrics.json` | Kết quả đánh giá mô hình |

---

**EmBeat AI — Music Recommender System**

Dự án xây dựng hệ thống gợi ý âm nhạc dựa trên Machine Learning, kết hợp FastAPI và giao diện web để hỗ trợ tìm kiếm, khám phá và đề xuất bài hát theo đặc trưng âm học, tâm trạng và sở thích người dùng.
