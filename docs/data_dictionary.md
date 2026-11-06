# TỪ ĐIỂN DỮ LIỆU CHUẨN HÓA (DATA DICTIONARY — EMBEAT 45M SPOTIFY TRACKS)

> **Dự án:** Hệ gợi ý nhạc trực tuyến bằng AI theo đặc trưng âm học (Content-Based)  
> **Người thực hiện:** Nguyễn Hoàng — Senior Data Engineer (Thành viên 1)  
> **Dataset áp dụng:** `GD-Studio/embeat_45m_spotify_tracks` (Hugging Face) & `data/processed/sample_tracks.csv`  
> **Phiên bản Schema:** 2.0 (Chuẩn hóa 100% theo Embeat 45M Audio Features)

---

## 1. Tổng quan Kiến trúc Schema

Dữ liệu đi qua Pipeline của Data Engineer (`src/stream_embeat.py` và `src/preprocess.py`) được chia làm **3 nhóm trường (Field Groups)**:
1. **Nhóm Định danh & Hiển thị (Metadata & Identity Fields):** Dùng để tra cứu bài hát, hiển thị tên bài/nghệ sĩ/thể loại trên giao diện Web và nhúng Spotify Embed Player.
2. **Nhóm 9 Đặc trưng Âm học Cốt lõi (Core 9 Audio Features — Vector $\mathbf{x} \in \mathbb{R}^9$):** Các biến liên tục được chuẩn hóa bằng `StandardScaler` để tính ma trận tương đồng `Cosine Similarity`.
3. **Nhóm 3 Đặc trưng Âm học Cấu trúc Bổ trợ (Structural Audio Features):** Cung cấp thông tin nhạc lý bổ sung (Cao độ, Điệu thức, Nhịp phách).

---

## 2. Nhóm 1: Trường Định danh, Metadata & Độ phổ biến

| Tên trường (Column) | Kiểu dữ liệu (Pandas/Python) | Cho phép Null? | Miền giá trị / Định dạng | Mô tả chi tiết & Vai trò trong hệ thống | Ví dụ thực tế |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **`track_id`** | `string` | Không (PK) | Chuỗi 22 ký tự Base62 của Spotify | Mã định danh duy nhất của bài hát trên Spotify. Dùng làm khóa chính tra cứu $O(1)$ và tạo link nhúng `https://open.spotify.com/embed/track/{track_id}`. | `0VjIjW4GlUZAMYd2vXMi3b` |
| **`track_name`** | `string` | Không | Chuỗi văn bản UTF-8 | Tên bài hát đã được cắt bỏ khoảng trắng thừa ở hai đầu. Dùng để hiển thị và tìm kiếm từ khóa (`/api/v1/search`). | `Blinding Lights` |
| **`artist_name`** | `string` | Không | Chuỗi văn bản UTF-8 (Mặc định: `"Unknown Artist"`) | Tên nghệ sĩ hoặc nhóm nhạc thể hiện chính. Phục vụ hiển thị UI và đo độ đa dạng nghệ sĩ (Artist Diversity). | `The Weeknd` |
| **`artist_genres`** | `string` | Có (Điền `"pop"` hoặc `"unknown"`) | Các thể loại phân cách bởi dấu phẩy | Nhãn thể loại âm nhạc gắn với nghệ sĩ (theo chuẩn Every Noise at Once). Dùng để đánh giá **Genre Diversity** của mô hình. | `canadian contemporary r&b, pop` |
| **`popularity`** | `int32` | Không | Số nguyên từ `0` đến `100` | Chỉ số độ phổ biến của bài hát trên Spotify. Dùng cho **Popularity Baseline (`recommend_by_popularity`)** và lọc rút gọn Compact Model. | `91` |

---

## 3. Nhóm 2: 9 Đặc trưng Âm học Cốt lõi (Đầu vào Ma trận Huấn luyện AI)

Đây là **9 cột bắt buộc** được trích xuất thành ma trận $\mathbf{X} \in \mathbb{R}^{N \times 9}$ (kiểu `float32`) trong `EmbeatRecommender`:

| STT | Tên trường | Kiểu dữ liệu | Miền giá trị chuẩn | Quy tắc làm sạch (Clipping) | Ý nghĩa Vật lý & Âm nhạc học |
| :-: | :--- | :--- | :---: | :---: | :--- |
| 1 | **`danceability`** | `float32` | `[0.0, 1.0]` | Cắt biên `< 0.0 -> 0.0`, `> 1.0 -> 1.0` | Đo mức độ phù hợp để khiêu vũ của bài hát dựa trên sự kết hợp giữa tempo, độ ổn định nhịp điệu (rhythm stability), độ mạnh của phách (beat strength). |
| 2 | **`energy`** | `float32` | `[0.0, 1.0]` | Cắt biên `[0.0, 1.0]` | Đại diện cho cường độ và mức độ hoạt động âm thanh. Bài hát có `energy` cao thường nhanh, mạnh mẽ, ồn ào (EDM, Hard Rock); thấp thường êm dịu (Ballad, Classical). |
| 3 | **`valence`** | `float32` | `[0.0, 1.0]` | Cắt biên `[0.0, 1.0]` | Đo lường sắc thái cảm xúc tích cực (musical positiveness). Giá trị cao (`> 0.7`) mang cảm giác vui tươi, hạnh phúc, phấn khích; giá trị thấp (`< 0.3`) mang cảm giác buồn, trầm lắng, u tối. |
| 4 | **`tempo`** | `float32` | `[30.0, 250.0]` BPM | Cắt biên `[30.0, 250.0]`, điền trung vị nếu `= 0` | Tốc độ hoặc nhịp độ tổng thể của bản nhạc, tính bằng số nhịp đập trên mỗi phút (**BPM — Beats Per Minute**). |
| 5 | **`acousticness`** | `float32` | `[0.0, 1.0]` | Cắt biên `[0.0, 1.0]` | Độ tin cậy xem bản nhạc có phải được thu bằng nhạc cụ mộc (acoustic guitar, piano cơ, violin) hay không. Giá trị gần `1.0` là thuần mộc. |
| 6 | **`instrumentalness`** | `float32` | `[0.0, 1.0]` | Cắt biên `[0.0, 1.0]` | Dự đoán bài hát có chứa giọng hát (vocal) hay không. Giá trị `> 0.5` biểu thị bản nhạc không lời (Lo-fi beat, Piano solo, Soundtrack); gần `0.0` là bài hát có lời. |
| 7 | **`liveness`** | `float32` | `[0.0, 1.0]` | Cắt biên `[0.0, 1.0]` | Phát hiện sự hiện diện của tiếng khán giả trong bản thu. Giá trị `> 0.8` cho thấy xác suất rất cao bài hát được thu âm trực tiếp tại sân khấu (Live Concert). |
| 8 | **`speechiness`** | `float32` | `[0.0, 1.0]` | Cắt biên `[0.0, 1.0]` | Phát hiện mật độ từ ngữ được nói/đọc. Giá trị `< 0.33` là nhạc hát thông thường; `0.33 – 0.66` là nhạc kết hợp lời nói và giai điệu (Rap/Hip-Hop); `> 0.66` là bản thu thuần giọng nói (Podcast/Audiobook). |
| 9 | **`loudness`** | `float32` | `[-60.0, 0.0]` dB | Cắt biên `[-60.0, 5.0]` dB | Độ to trung bình của bài hát tính bằng đơn vị **Decibel (dB)** toàn cục. Dùng để phân biệt độ nén âm thanh (mastering compression) giữa các bản thu. |

---

## 4. Nhóm 3: 3 Đặc trưng Âm học Cấu trúc Bổ trợ (Tổng cộng đủ 12 Audio Features)

Các trường này có sẵn trong Embeat 45M và được giữ lại trong tập dữ liệu làm sạch để phục vụ phân tích chuyên sâu hoặc lọc nâng cao:

| STT | Tên trường | Kiểu dữ liệu | Miền giá trị | Mô tả ý nghĩa nhạc lý |
| :-: | :--- | :--- | :---: | :--- |
| 10 | **`key`** | `int32` | `-1` đến `11` | Cao độ chủ âm (Pitch Class) của bài hát: `0 = C (Đô)`, `1 = C#/Db`, `2 = D (Rê)`, ..., `11 = B (Si)`. Giá trị `-1` nếu không phát hiện được. |
| 11 | **`mode`** | `int32` | `0` hoặc `1` | Điệu thức (Modality) của bài hát: `1 = Major (Giọng Trưởng — thường sáng và vui)`, `0 = Minor (Giọng Thứ — thường trầm và sâu lắng)`. |
| 12 | **`time_signature`** | `int32` | `3` đến `7` | Số chỉ nhịp ước tính (bao nhiêu phách trong một ô nhịp, phổ biến nhất là nhịp `4/4` ứng với giá trị `4`, hoặc nhịp Waltz `3/4` ứng với `3`). |

*(Ngoài ra có thể kèm trường `duration_ms` biểu thị thời lượng bài hát tính bằng mili-giây).*

---

## 5. Quy tắc Tiền xử lý & Kiểm định Chất lượng (Data Quality Rules)

Mọi lô dữ liệu (batch) đi qua `src/preprocess.py` đều bắt buộc phải vượt qua 5 chốt kiểm định (Quality Gates) sau trước khi đưa vào `EmbeatRecommender`:

1. **Loại bỏ bản ghi hỏng định danh:** Xóa các dòng có `track_id` hoặc `track_name` bị `Null` hoặc chuỗi rỗng.
2. **Khử trùng lặp (`Deduplication`):** Giữ lại bản ghi đầu tiên theo khóa chính `track_id` (`drop_duplicates(subset=['track_id'])`).
3. **Xử lý giá trị khuyết (`Imputation`):**
   - Các cột âm học bị thiếu được điền bằng giá trị trung vị chuẩn (hoặc `0.0` sau chuẩn hóa).
   - Nếu `tempo <= 0`, tự động thay thế bằng `120.0` BPM (nhịp độ trung bình chuẩn của âm nhạc hiện đại).
4. **Cắt ngưỡng ngoại lai (`Outlier Clipping`):** Đảm bảo không có bất kỳ giá trị lỗi cảm biến nào vượt ra ngoài miền vật lý (ví dụ: cắt các cột tỷ lệ về đúng đoạn `[0.0, 1.0]`, cắt `loudness` về `[-60.0, 5.0]`).
5. **Tối ưu hóa bộ nhớ (`Memory Downcasting`):** Toàn bộ 9 đặc trưng âm học được ép kiểu về `numpy.float32` (giảm 50% dung lượng RAM so với `float64` mặc định của Pandas).

