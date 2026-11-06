
import os
import json
import logging
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# 9 Đặc trưng âm học cốt lõi phục vụ tính toán vector tương đồng (Cosine Similarity)
CORE_AUDIO_FEATURES = [
    "danceability",
    "energy",
    "valence",
    "tempo",
    "acousticness",
    "instrumentalness",
    "liveness",
    "speechiness",
    "loudness",
]

# 3 Đặc trưng cấu trúc nhạc lý bổ trợ (Đủ 12 Audio Features chuẩn Spotify)
STRUCTURAL_AUDIO_FEATURES = [
    "key",
    "mode",
    "time_signature",
]

ALL_12_AUDIO_FEATURES = CORE_AUDIO_FEATURES + STRUCTURAL_AUDIO_FEATURES

# Các trường định danh và thông tin hiển thị
METADATA_COLUMNS = [
    "track_id",
    "track_name",
    "artist_name",
    "artist_genres",
    "popularity",
]

# Ngưỡng vật lý hợp lệ (Domain Bounds) dùng để cắt ngoại lai (Outlier Clipping)
FEATURE_BOUNDS: Dict[str, tuple] = {
    "danceability": (0.0, 1.0),
    "energy": (0.0, 1.0),
    "valence": (0.0, 1.0),
    "tempo": (30.0, 250.0),
    "acousticness": (0.0, 1.0),
    "instrumentalness": (0.0, 1.0),
    "liveness": (0.0, 1.0),
    "speechiness": (0.0, 1.0),
    "loudness": (-60.0, 5.0),
    "popularity": (0, 100),
}

# Giá trị mặc định an toàn khi bị khuyết (Imputation Defaults)
DEFAULT_VALUES: Dict[str, Any] = {
    "danceability": 0.5,
    "energy": 0.5,
    "valence": 0.5,
    "tempo": 120.0,
    "acousticness": 0.2,
    "instrumentalness": 0.0,
    "liveness": 0.15,
    "speechiness": 0.05,
    "loudness": -8.0,
    "key": 0,
    "mode": 1,
    "time_signature": 4,
    "popularity": 30,
    "artist_name": "Unknown Artist",
    "artist_genres": "pop",
}


def validate_and_clean_batch(
    df: pd.DataFrame,
    deduplicate: bool = True,
    min_popularity: int = 0,
) -> pd.DataFrame:
    """
    Thực hiện 5 bước kiểm định và làm sạch trên một batch dữ liệu Embeat 45M:
    1. Chuẩn hóa tên cột & đảm bảo đầy đủ schema.
    2. Loại bỏ các dòng thiếu khóa định danh (track_id, track_name).
    3. Khử trùng lặp theo track_id.
    4. Xử lý giá trị khuyết (Imputation) và cắt ngưỡng ngoại lai (Outlier Clipping).
    5. Ép kiểu dữ liệu tối ưu bộ nhớ (float32 / int32).
    """
    if df is None or df.empty:
        return pd.DataFrame(columns=METADATA_COLUMNS + ALL_12_AUDIO_FEATURES)

    clean = df.copy()

    # Hỗ trợ ánh xạ tên cột tương đương nếu phân vùng Parquet dùng tên thay thế
    rename_map = {
        "id": "track_id",
        "name": "track_name",
        "artists": "artist_name",
        "genres": "artist_genres",
    }
    for old_col, new_col in rename_map.items():
        if old_col in clean.columns and new_col not in clean.columns:
            clean.rename(columns={old_col: new_col}, inplace=True)

    # 1. Kiểm tra cột bắt buộc tối thiểu
    if "track_id" not in clean.columns or "track_name" not in clean.columns:
        raise ValueError(
            f"DataFrame thiếu cột định danh bắt buộc ('track_id', 'track_name'). "
            f"Các cột hiện có: {list(clean.columns)}"
        )

    # 2. Xóa các bản ghi có track_id hoặc track_name bị Null/Rỗng
    clean = clean.dropna(subset=["track_id", "track_name"])
    clean["track_id"] = clean["track_id"].astype(str).str.strip()
    clean["track_name"] = clean["track_name"].astype(str).str.strip()
    clean = clean[(clean["track_id"] != "") & (clean["track_name"] != "")]

    # 3. Khử trùng lặp theo track_id
    if deduplicate:
        clean = clean.drop_duplicates(subset=["track_id"], keep="first")

    # 4. Đảm bảo các cột Metadata phụ trợ luôn tồn tại
    for meta_col in ["artist_name", "artist_genres", "popularity"]:
        if meta_col not in clean.columns:
            clean[meta_col] = DEFAULT_VALUES[meta_col]
        else:
            clean[meta_col] = clean[meta_col].fillna(DEFAULT_VALUES[meta_col])

    clean["artist_name"] = clean["artist_name"].astype(str).str.strip()
    clean["artist_genres"] = clean["artist_genres"].astype(str).str.strip()

    # Chuẩn hóa popularity và lọc theo ngưỡng nếu có
    clean["popularity"] = pd.to_numeric(clean["popularity"], errors="coerce").fillna(
        DEFAULT_VALUES["popularity"]
    )
    low_pop, high_pop = FEATURE_BOUNDS["popularity"]
    clean["popularity"] = clean["popularity"].clip(lower=low_pop, upper=high_pop).astype("int32")

    if min_popularity > 0:
        clean = clean[clean["popularity"] >= min_popularity]

    # 5. Làm sạch và cắt biên 9 đặc trưng âm học cốt lõi + 3 đặc trưng cấu trúc
    for feat in CORE_AUDIO_FEATURES:
        if feat not in clean.columns:
            clean[feat] = DEFAULT_VALUES[feat]
        clean[feat] = pd.to_numeric(clean[feat], errors="coerce").fillna(DEFAULT_VALUES[feat])

        # Xử lý riêng tempo <= 0 (lỗi đo nhịp phổ biến)
        if feat == "tempo":
            clean.loc[clean["tempo"] <= 0, "tempo"] = DEFAULT_VALUES["tempo"]

        low_b, high_b = FEATURE_BOUNDS[feat]
        clean[feat] = clean[feat].clip(lower=low_b, upper=high_b).astype("float32")

    for s_feat in STRUCTURAL_AUDIO_FEATURES:
        if s_feat not in clean.columns:
            clean[s_feat] = DEFAULT_VALUES[s_feat]
        clean[s_feat] = (
            pd.to_numeric(clean[s_feat], errors="coerce")
            .fillna(DEFAULT_VALUES[s_feat])
            .astype("int32")
        )

    # Sắp xếp thứ tự cột chuẩn hóa
    ordered_cols = [c for c in (METADATA_COLUMNS + ALL_12_AUDIO_FEATURES) if c in clean.columns]
    extra_cols = [c for c in clean.columns if c not in ordered_cols]
    return clean[ordered_cols + extra_cols].reset_index(drop=True)


def compute_data_quality_report(
    raw_df: pd.DataFrame,
    clean_df: pd.DataFrame,
    save_path: Optional[str] = "data/processed/data_quality_report.json",
) -> Dict[str, Any]:
    """
    Tính toán báo cáo thống kê trước và sau khi làm sạch dữ liệu để phục vụ
    kiểm định chất lượng (Data Governance) và báo cáo đồ án.
    """
    raw_count = len(raw_df) if raw_df is not None else 0
    clean_count = len(clean_df) if clean_df is not None else 0
    removed_count = raw_count - clean_count

    feature_stats: Dict[str, Dict[str, float]] = {}
    for feat in CORE_AUDIO_FEATURES + ["popularity"]:
        if feat in clean_df.columns and clean_count > 0:
            series = clean_df[feat]
            feature_stats[feat] = {
                "mean": round(float(series.mean()), 4),
                "std": round(float(series.std()), 4),
                "min": round(float(series.min()), 4),
                "p25": round(float(series.quantile(0.25)), 4),
                "median": round(float(series.median()), 4),
                "p75": round(float(series.quantile(0.75)), 4),
                "max": round(float(series.max()), 4),
                "null_count_after_clean": int(series.isna().sum()),
            }

    unique_artists = int(clean_df["artist_name"].nunique()) if "artist_name" in clean_df.columns else 0
    unique_genres = int(clean_df["artist_genres"].nunique()) if "artist_genres" in clean_df.columns else 0

    report = {
        "dataset_name": "GD-Studio/embeat_45m_spotify_tracks",
        "schema_version": "2.0",
        "row_counts": {
            "raw_rows": raw_count,
            "clean_rows": clean_count,
            "removed_invalid_or_duplicate_rows": removed_count,
            "retention_rate_pct": round((clean_count / raw_count * 100.0), 2) if raw_count > 0 else 0.0,
        },
        "catalog_diversity": {
            "unique_tracks": clean_count,
            "unique_artists": unique_artists,
            "unique_genre_combinations": unique_genres,
        },
        "core_audio_features": CORE_AUDIO_FEATURES,
        "structural_audio_features": STRUCTURAL_AUDIO_FEATURES,
        "feature_distributions": feature_stats,
    }

    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        logging.info(f"Đã xuất báo cáo chất lượng dữ liệu tại: {save_path}")

    return report

