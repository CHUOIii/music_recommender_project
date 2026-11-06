# BIÊN BẢN BÀN GIAO DỮ LIỆU & PIPELINE CHO ML ENGINEER (DATA -> ML HANDOFF)

> **Người bàn giao:** Nguyễn Hoàng — Senior Data Engineer (Thành viên 1)  
> **Người tiếp nhận:** Lê Chí Thiện — ML Engineer (Thành viên 2)  
> **Dataset chính thức:** `GD-Studio/embeat_45m_spotify_tracks` (Hugging Face Hub)  
> **Trạng thái Pipeline Dữ liệu:** ✅ Hoàn thành 100% & Đã kiểm định chất lượng (Quality Gate Passed)

---

## 1. Các Sản Phẩm Data Engineer Đã Bàn Giao Trong Repository

| STT | Tệp bàn giao | Vai trò kỹ thuật |
| :-: | :--- | :--- |
| 1 | `src/preprocess.py` | Module kiểm định schema, loại bỏ Null/Duplicate, cắt ngưỡng ngoại lai (`FEATURE_BOUNDS`) và ép kiểu `float32`. |
| 2 | `src/stream_embeat.py` | Module stream trực tiếp từ Hugging Face theo từng Row Group (tự động gọi `validate_and_clean_batch` và tự động fallback sang `sample_tracks.csv` nếu chạy offline). |
| 3 | `src/download_embeat.py` | Script trích xuất bộ dữ liệu mẫu 5.000 bài hát phân tầng và tạo báo cáo chất lượng dữ liệu. |
| 4 | `data/processed/sample_tracks.csv` | Tập dữ liệu sạch gồm **5.000 bài hát** (có sẵn `track_id` Spotify thật) để ML/Backend/Frontend test nhanh dưới 1 giây mà không cần mạng. |
| 5 | `data/processed/data_quality_report.json` | Báo cáo thống kê phân phối Mean, Std, Min, Max, Quantiles của 9 đặc trưng âm học và `popularity`. |
| 6 | `notebooks/01_explore_data.ipynb` | Notebook phân tích khám phá dữ liệu (EDA) Embeat 45M. |
| 7 | `notebooks/02_preprocess_data.ipynb` | Notebook kiểm chứng làm sạch dữ liệu và chuẩn hóa `StandardScaler`. |
| 8 | `docs/data_dictionary.md` & `docs/dataset_sources.md` | Từ điển dữ liệu chuẩn hóa Schema v2.0 và tài liệu nguồn gốc giấy phép CC-BY-NC 4.0. |

---

## 2. Giao Ước Kỹ Thuật (Contract 1: Data $\rightarrow$ ML)

Mọi `batch_df` được truyền vào `callback_fn` từ `stream_and_train_50pct()` đều cam kết **100% sạch Null, không trùng `track_id`** và tuân thủ đúng kiểu dữ liệu sau:

- **Các cột định danh & hiển thị (`METADATA_COLUMNS`):**
  - `track_id` (`str`), `track_name` (`str`), `artist_name` (`str`), `artist_genres` (`str`), `popularity` (`int32`, `0 -> 100`).
- **9 cột đặc trưng âm học cốt lõi (`CORE_AUDIO_FEATURES` — kiểu `float32`):**
  ```python
  from src.preprocess import CORE_AUDIO_FEATURES
  # ['danceability', 'energy', 'valence', 'tempo',
  #  'acousticness', 'instrumentalness', 'liveness', 'speechiness', 'loudness']
  ```

---

## 3. Hướng Dẫn Gọi Pipeline Cho ML Engineer (Lê Chí Thiện)

```python
import os
from src.stream_embeat import stream_and_train_50pct

def training_callback(clean_batch_df):
    # clean_batch_df đã qua validate_and_clean_batch() của Data Engineer
    # Chỉ việc đưa thẳng vào recommender.fit_incremental(clean_batch_df, ...)
    print(f"Nhận batch sạch gồm {len(clean_batch_df):,} bài hát!")

# Chạy tự động: Nếu có HF_TOKEN sẽ stream từ Cloud; nếu không có sẽ tự nạp từ sample_tracks.csv
stream_and_train_50pct(
    hf_token=os.environ.get("HF_TOKEN"),
    callback_fn=training_callback,
    sample_ratio=0.5,
    clean_batches=True,
    fallback_to_local=True,
)
```

