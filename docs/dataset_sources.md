# TÀI LIỆU NGUỒN GỐC DỮ LIỆU & BÁO CÁO KHẢO SÁT DATASET (DATASET SOURCES)

> **Dự án:** Hệ gợi ý nhạc trực tuyến bằng AI theo đặc trưng âm học (Content-Based)  
> **Người thực hiện:** Nguyễn Hoàng — Senior Data Engineer (Thành viên 1)  
> **Dataset chính thức:** `GD-Studio/embeat_45m_spotify_tracks` (Hugging Face Hub)  
> **Trạng thái:** Đã chốt chính thức (Single Source of Truth)

---

## 1. Báo cáo khảo sát & Lý do chọn Dataset duy nhất (Task 1.1)

Trong giai đoạn khởi đầu dự án, Data Engineer đã tiến hành khảo sát 4 nguồn dữ liệu âm nhạc phổ biến và đối chiếu với mục tiêu xây dựng **Hệ gợi ý bài hát theo giai điệu, cảm xúc và tiết tấu âm học (Content-Based Audio Recommender)** có khả năng giải quyết triệt để bài toán Cold-Start:

| Tiêu chí so sánh | 1. Million Song Dataset (MSD - 2011) | 2. Spotify MPD (1M Playlists) | 3. Last.fm Dataset | 4. Embeat 45M Spotify Tracks (ĐƯỢC CHỌN) |
| :--- | :--- | :--- | :--- | :--- |
| **Quy mô bài hát** | ~1.000.000 bài hát | ~2.262.292 bài hát | ~1.000.000 bài hát | **~45.059.660 bài hát (Lấy mẫu 50% ~ 22.5M)** |
| **Đặc trưng âm học (Audio Features)** | Cũ, thiếu các chỉ số chuẩn Spotify (`valence`, `danceability` không đồng nhất) | ❌ **Không có sẵn** (chỉ có danh sách ID bài hát trong playlist) | ❌ **Không có sẵn** (chỉ có lịch sử nghe & social tags) | ✅ **Đầy đủ 12 đặc trưng âm học chuẩn Spotify API** |
| **Thông tin độ phổ biến (`popularity`)** | Không chuẩn hóa theo thang 0-100 hiện đại | ❌ Không có | Dựa trên lượt nghe cũ | ✅ **Có sẵn điểm `popularity` (0 – 100) chuẩn Spotify** |
| **Định dạng lưu trữ & Truy cập** | HDF5 rời rạc (~280GB), cực kỳ khó đọc | JSON lớn (~35GB giải nén) | CSV/TSV rời rạc | ✅ **Apache Parquet nén chuẩn (3 phân vùng, hỗ trợ HTTP Streaming)** |
| **Khả năng nhúng trình phát nhạc Demo** | ❌ Mã EchoNest ID cũ (đã ngừng hoạt động) | ✅ Có Spotify Track URI | ❌ Không có Spotify ID | ✅ **Có `track_id` chuẩn Spotify (nhúng trực tiếp Iframe Player)** |
| **Quyết định của nhóm** | ❌ **Loại bỏ** | ❌ **Loại bỏ** | ❌ **Loại bỏ** | ✅ **CHỐT SỬ DỤNG DUY NHẤT** |

### Kết luận của Data Engineer:
Việc sử dụng **duy nhất bộ dữ liệu `GD-Studio/embeat_45m_spotify_tracks`** giúp hệ thống:
1. Đồng nhất 100% schema từ khâu tiền xử lý đến huấn luyện AI và hiển thị giao diện.
2. Có sẵn `track_id` thật của Spotify để tầng Frontend nhúng trực tiếp widget nghe nhạc (`https://open.spotify.com/embed/track/{track_id}`).
3. Không cần tải hàng chục GB dữ liệu về máy nhờ kiến trúc đọc trực tuyến theo từng cụm hàng (**Parquet Row-Group Streaming**).

---

## 2. Thông tin chi tiết Dataset Embeat 45M Spotify Tracks

- **Tên định danh trên Hugging Face:** `GD-Studio/embeat_45m_spotify_tracks`
- **URL chính thức:** <https://huggingface.co/datasets/GD-Studio/embeat_45m_spotify_tracks>
- **Định dạng tệp gốc:** Apache Parquet (chia thành 3 phân vùng):
  - `data/train-00000-of-00003.parquet`
  - `data/train-00001-of-00003.parquet`
  - `data/train-00002-of-00003.parquet`
- **Tổng dung lượng trên Cloud:** ~9.5 GB (nén Snappy/Zstd).
- **Tổng số bản ghi nguyên bản:** ~45.059.660 bài hát.
- **Chiến lược lấy mẫu của dự án:**
  - **Chế độ Full Stream (`CFG_DATA_SCALE = A1`):** Lấy mẫu ngẫu nhiên có kiểm soát (`random_state=42`) 40% – 50% trên từng Row Group (~18.02 – 22.52 triệu bài hát).
  - **Chế độ Compact (`CFG_DATA_SCALE = A2`):** Lọc giữ lại các bài hát có `popularity >= 25` (100.000 – 300.000 bài hát) phục vụ Web API thời gian thực (< 15ms).
  - **Chế độ Sample Offline (`CFG_DATA_SCALE = A3`):** Tập mẫu chuẩn hóa `data/processed/sample_tracks.csv` gồm **5.000 bài hát** đa dạng thể loại được lưu sẵn trong repository để cả 4 thành viên chạy kiểm thử tức thì mà không cần kết nối mạng hay Token.

---

## 3. Giấy phép sử dụng & Tuân thủ bảo mật (License & Governance)

1. **Giấy phép (License):** Bộ dữ liệu được phát hành dưới giấy phép **Creative Commons Attribution-NonCommercial 4.0 International (CC-BY-NC 4.0)**.
   - **Được phép:** Sao chép, phân phối lại, trích xuất đặc trưng và huấn luyện mô hình AI phục vụ mục đích học tập, đồ án môn học và nghiên cứu khoa học phi thương mại.
   - **Yêu cầu:** Ghi rõ nguồn trích dẫn từ `GD-Studio/embeat_45m_spotify_tracks`.
2. **Quản lý Khóa Truy cập (`HF_TOKEN`):**
   - Dataset yêu cầu người dùng đăng nhập tài khoản Hugging Face và chấp nhận điều khoản truy cập (Gated Repository).
   - **Quy tắc bảo mật bắt buộc:** Tuyệt đối **KHÔNG** ghi cứng (hardcode) chuỗi `hf_...` vào mã nguồn Python hoặc Notebook khi đẩy lên GitHub. Mọi truy cập phải đọc qua biến môi trường `os.environ.get("HF_TOKEN")` hoặc tệp `.env` (đã được chặn trong `.gitignore`).

