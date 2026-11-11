# EmBeat AI - Music Recommender System

> **Hệ thống gợi ý âm nhạc trực tuyến toàn diện (Full-Stack AI Music Recommender System)**
>
> Open-source ML project using dataset: `GD-Studio/embeat_45m_spotify_tracks` (45M+ Spotify Tracks from Hugging Face).

---

## Giới thiệu (Overview)

**EmBeat AI** là giải pháp gợi ý âm nhạc cá nhân hóa dựa trên phân tích 9 đặc trưng âm học (Audio Features) cốt lõi của bài hát thay vì phụ thuộc hoàn toàn vào lịch sử nghe nhạc truyền thống. Hệ thống hỗ trợ tìm kiếm bài hát mồi, đề xuất các bài hát có giai điệu và tiết tấu tương đồng bằng mô hình Machine Learning Cosine Similarity, hiển thị trực quan biểu đồ Radar Chart và nhúng khung nghe nhạc Spotify Embed trực tiếp trên giao diện Single Page Application (SPA).

---

## Tính năng chính (Key Features)

* **Giao diện SPA Đa Tab (Single Page Application):** Điều hướng mượt mà giữa các view chính (Trang chủ, Gu âm nhạc, Phân tích Audio) với cơ chế tự động ẩn/hiện thanh tìm kiếm & bộ lọc cảm xúc (Mood) thông minh.
* **Tìm kiếm & Gợi ý thông minh:** Tích hợp gọi API trực tiếp từ backend để tìm kiếm bài hát theo từ khóa, trả về danh sách gợi ý kèm điểm số tương đồng (Match Score).
* **Trình phát nhạc nhúng (Spotify Player Embed):** Nghe thử bài hát trực tiếp ngay trên giao diện thông qua widget `<iframe>` chính chủ của Spotify.
* **Trực quan hóa Radar Chart:** Sử dụng thư viện `Chart.js` để vẽ biểu đồ đa chiều so sánh các chỉ số đặc trưng âm học (*Danceability, Energy, Valence, Acousticness, Liveness, Speechiness*).
* **Quản lý Gu âm nhạc cá nhân:** Lưu trữ danh sách bài hát yêu thích thông qua bộ nhớ cục bộ `localStorage` của trình duyệt.
* **Trang Phân tích Audio (Analysis View):** Minh bạch hóa các thông số kỹ thuật của 9 đặc trưng âm học và mô hình AI cho người dùng.

---

## Công nghệ sử dụng (Tech Stack)

### **Frontend (SPA Client)**
* **HTML5 & Vanilla JavaScript (ES6+):** Quản lý trạng thái view động, tương tác DOM và gọi REST API.
* **Tailwind CSS (CDN):** Thiết kế giao diện Modern Dark Theme chuẩn Spotify.
* **Chart.js (CDN):** Vẽ biểu đồ mạng nhện (Radar Chart) hiển thị chỉ số Audio Features.
* **FontAwesome (v6.4.0):** Hệ thống icon giao diện.

### **Backend & Machine Learning Engine**
* **Python 3.10+ & FastAPI:** Xây dựng RESTful API tốc độ cao, hỗ trợ CORS Middleware và Lifespan loading.
* **Pydantic (v2):** Kiểm định dữ liệu Request & Response schemas (`backend/schemas.py`).
* **Scikit-Learn & NumPy:** Chuẩn hóa `StandardScaler` và tính toán khoảng cách vector tương đồng.
* **Pandas & PyArrow:** Tiền xử lý dữ liệu, streaming Parquet dataset và tự động Fallback CSV khi dev offline.

---

## 9 Đặc trưng âm học (Audio Features)

Mô hình gợi ý dựa trên vector 9 chiều âm học $\mathbf{x} \in \mathbb{R}^9$:

| STT | Đặc trưng | Tên trường API | Mô tả ý nghĩa âm học |
| :---: | :--- | :--- | :--- |
| 1 | Độ nhảy múa | `danceability` | Mức độ phù hợp để nhảy múa dựa trên nhịp điệu và độ ổn định beat (`0.0 -> 1.0`). |
| 2 | Năng lượng | `energy` | Cường độ cảm nhận âm thanh dồn dập, mạnh mẽ (EDM/Rock) vs êm dịu (`0.0 -> 1.0`). |
| 3 | Cảm xúc | `valence` | Sắc thái cảm xúc: cao = vui tươi, hào hứng; thấp = trầm buồn (`0.0 -> 1.0`). |
| 4 | Độ mộc | `acousticness` | Tỷ lệ sử dụng nhạc cụ mộc/gỗ không qua xử lý điện tử (`0.0 -> 1.0`). |
| 5 | Độ sống động | `liveness` | Phát hiện âm thanh sân khấu/khán giả thu trực tiếp Live Concert (`0.0 -> 1.0`). |
| 6 | Lời bài hát | `speechiness` | Mật độ lời nói/rap thuần túy trong bài hát (`0.0 -> 1.0`). |
| 7 | Tốc độ nhịp | `tempo` | Tốc độ nhịp đập trên mỗi phút (BPM). |
| 8 | Nhạc cụ | `instrumentalness` | Mức độ bài hát thuần nhạc cụ không lời (`0.0 -> 1.0`). |
| 9 | Độ lớn | `loudness` | Độ lớn âm lượng trung bình của bản thu (dB, `-60 -> 0`). |

---

## Cấu trúc dự án (Repository Structure)

```text
music_recommender_project/
├── artifacts/
│   ├── embeat_recommender.joblib      # File mô hình ML đã huấn luyện chính
│   ├── main_model_metadata.json       # Metadata cấu hình model chính
│   └── training_metadata.json         # Metadata quá trình train
├── backend/
│   ├── tests/                         # Unit tests cho các API endpoints
│   ├── venv/                          # Môi trường ảo Python
│   ├── app.py                         # FastAPI Server chính
│   └── schemas.py                     # Định nghĩa Pydantic Request/Response models
├── data/
│   └── processed/
│       ├── balanced_eda.csv           # Dữ liệu phân tích khám phá cân bằng
│       ├── data_quality_report.json   # Báo cáo kiểm định chất lượng dữ liệu
│       ├── embeat_sample_tracks.csv   # Dữ liệu mẫu chuẩn Embeat
│       └── sample_tracks.csv          # Dữ liệu mẫu fallback offline
├── docs/
│   ├── api_contract.md                # Đặc tả RESTful API giữa Backend và Frontend
│   ├── bug_log.md                     # Nhật ký ghi nhận và xử lý lỗi tích hợp (QA)
│   ├── data_dictionary.md             # Từ điển định nghĩa các trường dữ liệu âm học
│   ├── dataset_sources.md             # Báo cáo khảo sát nguồn dataset & giấy phép
│   ├── HANDOFF_TO_ML_ENGINEER.md      # Biên bản bàn giao kỹ thuật giữa DE và ML
│   └── test_plan.md                   # Kế hoạch kiểm thử hệ thống (Test Plan)
├── frontend/
│   ├── app.js                         # Logic SPA, gọi API, quản lý State & Chart.js
│   ├── index.html                     # Giao diện Web Dashboard chính
│   └── style.css                      # Tùy chỉnh CSS giao diện tối hiện đại
├── notebooks/
│   ├── 01_explore_data.ipynb          # EDA khám phá dữ liệu Embeat 45M
│   ├── 02_preprocess_data.ipynb       # Tiền xử lý và chuẩn hóa đặc trưng
│   ├── 03_train_model.ipynb           # Huấn luyện mô hình streaming
│   └── 04_evaluate_model.ipynb        # Đánh giá thực nghiệm mô hình
├── reports/
│   ├── figures/                       # Thư mục chứa biểu đồ trực quan hóa
│   ├── evaluation_dashboard.png       # Dashboard tổng hợp đánh giá
│   ├── evaluation_details.csv         # Chi tiết kết quả đánh giá thực nghiệm
│   ├── evaluation_summary.csv         # Tóm tắt kết quả đánh giá
│   └── metrics.json                   # File metrics định lượng của mô hình
├── src/
│   ├── download_embeat.py             # Script tải/trích xuất tập dữ liệu mẫu
│   ├── evaluate.py                    # Script chạy đánh giá mô hình CLI
│   ├── preprocess.py                  # Module kiểm định chất lượng & tiền xử lý dữ liệu
│   ├── recommender.py                 # Class EmbeatRecommender cốt lõi
│   ├── stream_embeat.py               # Module stream Parquet từ Hugging Face
│   └── train.py                       # Script huấn luyện & xuất artifact
├── .env.example                       # Mẫu cấu hình biến môi trường
├── .gitignore                         # Cấu hình bỏ qua file nhạy cảm/rác
├── music_recommender_project.md       # Master Plan kiến trúc tổng thể Full-Stack
├── README.md                          # Tài liệu giới thiệu tổng quan dự án
└── requirements.txt                   # Danh sách thư viện Python phụ thuộc
```

---

## Hướng dẫn cài đặt & Khởi chạy (Getting Started)

### 1. Cài đặt môi trường & Thư viện
Yêu cầu Python version **3.10** trở lên.

```bash
# Clone hoặc tải project về máy, sau đó di chuyển vào thư mục gốc
cd music_recommender_project

# Cài đặt các thư viện Python yêu cầu
pip install -r requirements.txt
```

### 2. Khởi động Backend Server (FastAPI)
```bash
# Chạy FastAPI server (mặc định hỗ trợ cổng 5000)
uvicorn backend.app:app --reload --port 5000
```
* **Swagger UI Documentation:** `http://127.0.0.1:5000/docs`
* **API Health Check:** `http://127.0.0.1:5000/api/v1/health`

### 3. Trải nghiệm Frontend
* Mở tệp `frontend/index.html` trực tiếp bằng trình duyệt hoặc sử dụng tính năng **Live Server** trong VS Code (chạy tại `http://127.0.0.1:5500`).
* Đảm bảo Backend Server đang chạy để giao diện có thể kết nối và nhận dữ liệu gợi ý từ mô hình AI.

---

## 🔗 Danh sách REST API Endpoints

| Method | Endpoint | Mô tả chức năng |
| :---: | :--- | :--- |
| `GET` | `/api/v1/health` | Kiểm tra trạng thái server & mô hình ML đang nạp. |
| `GET` | `/api/v1/search?q={query}` | Tìm kiếm bài hát theo từ khóa và trả về Audio Features. |
| `GET` | `/api/v1/tracks/{track_id}` | Lấy chi tiết thông tin và 9 đặc trưng âm học của 1 bài hát. |
| `GET` | `/api/v1/recommend/track/{track_id}` | Gợi ý bài hát tương đồng theo `audio`, `hybrid`, hoặc `mmr`. |
| `POST` | `/api/v1/recommend/profile` | Gợi ý bài hát dựa trên danh sách nhiều bài trong Gu âm nhạc. |
| `GET` | `/api/v1/recommend/popular` | Gợi ý bài hát phổ biến nhất (Cold-start baseline). |
| `GET` | `/api/v1/recommend/mood/{mood_name}` | Gợi ý bài hát theo cảm xúc tâm trạng. |

---

## Thành viên nhóm & Phân công nhiệm vụ

* **Senior Data Engineer:** Nguyễn Hoàng — Xây dựng pipeline xử lý dataset 45M bài hát từ Hugging Face, kiểm định và làm sạch dữ liệu.
* **ML Engineer:** Minh Khoa — Huấn luyện mô hình `EmbeatRecommender`, tối ưu thuật toán gợi ý Cosine Similarity và đánh giá thực nghiệm.
* **Backend Engineer:** Nhật Minh Phạm — Xây dựng hệ thống REST API bằng FastAPI, Pydantic schemas và viết Unit Test tự động.
* **Frontend & QA Lead:** Lê Thiện Chí — Phát triển giao diện SPA, tích hợp Spotify Player, Radar Chart, lập kế hoạch kiểm thử (`docs/test_plan.md`) và quản lý lỗi (`docs/bug_log.md`).

---

## Nguồn dữ liệu & Giấy phép (Credits & License)

* **Dataset:** `GD-Studio/embeat_45m_spotify_tracks` (Hugging Face Hub) dưới giấy phép **CC-BY-NC 4.0** (Phi thương mại, phục vụ nghiên cứu & học tập).
* **Player:** Spotify Web Embed API.