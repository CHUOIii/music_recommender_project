
import pandas as pd
from sklearn.preprocessing import StandardScaler


AUDIO_FEATURES = [
    "danceability",
    "energy",
    "valence",
    "tempo",
    "acousticness",
    "instrumentalness",
    "speechiness",
    "liveness",
    "loudness"
]


def clean_tracks(df):
    """
    Clean music metadata and audio features.
    """

    df = df.copy()

    # Remove duplicate tracks
    df = df.drop_duplicates(
        subset="track_id"
    )

    # Convert audio features to numeric
    for col in AUDIO_FEATURES:
        df[col] = pd.to_numeric(
            df[col],
            errors="coerce"
        )

    # Remove missing audio features
    df = df.dropna(
        subset=AUDIO_FEATURES
    )

    # Remove invalid tempo
    df = df[df["tempo"] > 0]

    return df.reset_index(drop=True)


def fit_scaler(df):
    """
    Fit StandardScaler on audio features.
    """

    scaler = StandardScaler()

    scaled_features = scaler.fit_transform(
        df[AUDIO_FEATURES]
    )

    return scaler, scaled_features


def transform_features(df, scaler):
    """
    Transform audio features using fitted scaler.
    """

    return scaler.transform(
        df[AUDIO_FEATURES]
    )


def validate_and_clean_batch(
    df,
    deduplicate=True,
    min_popularity=0,
):
    """
    Validate and clean one incoming Embeat data batch.

    Keeps the original metadata columns while cleaning
    the audio features required by the recommender.
    """

    df = df.copy()

    # 1. Remove duplicated tracks within this batch
    if deduplicate and "track_id" in df.columns:
        df = df.drop_duplicates(
            subset="track_id"
        )

    # 2. Validate required audio columns
    missing_features = [
        col for col in AUDIO_FEATURES
        if col not in df.columns
    ]

    if missing_features:
        raise ValueError(
            f"Missing audio features: {missing_features}"
        )

    # 3. Convert audio features to numeric
    for col in AUDIO_FEATURES:
        df[col] = pd.to_numeric(
            df[col],
            errors="coerce"
        )

    # 4. Remove rows with invalid audio features
    df = df.dropna(
        subset=AUDIO_FEATURES
    )

    # 5. Remove invalid tempo
    df = df[df["tempo"] > 0]

    # 6. Apply minimum popularity filter
    if min_popularity > 0:
        if "popularity" not in df.columns:
            raise ValueError(
                "Missing required column: popularity"
            )

        df["popularity"] = pd.to_numeric(
            df["popularity"],
            errors="coerce"
        )

        df = df.dropna(
            subset=["popularity"]
        )

        df = df[
            df["popularity"] >= min_popularity
        ]

    return df.reset_index(drop=True)
