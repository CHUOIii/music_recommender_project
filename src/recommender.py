import numpy as np
import pandas as pd
import joblib

from pathlib import Path
from scipy.sparse import csr_matrix

from sklearn.metrics.pairwise import cosine_similarity

from src.preprocess import (
    AUDIO_FEATURES,
    clean_tracks,
    fit_scaler
)


class EmbeatRecommender:
    """
    Embeat Music Recommendation Model.

    Supported methods:
    - Audio-only Recommendation
    - Hybrid Recommendation
    - Hybrid + MMR Recommendation
    - Taste Profile Recommendation
    - Popularity-based Recommendation
    """

    def __init__(self):
        self.df = None
        self.scaler = None
        self.feature_matrix = None
        self.id_to_idx = {}
        self.genre_matrix = None

        # Temporary storage for incoming batches
        self._pending_batches = []

    # ==========================================
    # 1. MODEL TRAINING
    # ==========================================

    def fit(self, df):
        """
        Clean data and train the audio feature scaler.
        """

        self.df = clean_tracks(df)

        self.scaler, self.feature_matrix = fit_scaler(
            self.df
        )

        self.id_to_idx = {
            track_id: idx
            for idx, track_id in enumerate(
                self.df["track_id"]
            )
        }

        # Reset genre matrix after retraining
        self.genre_matrix = None

        # Clear pending batches after successful full training
        self._pending_batches = []

        return self


    def fit_incremental(
        self,
        df: pd.DataFrame,
        is_first_batch: bool = False
    ) -> None:
        """
        Accumulate incoming data batches.

        If is_first_batch=True, clear previous pending batches
        before receiving the new training sequence.

        Actual model training is performed by
        finalize_incremental_training().
        """

        if not isinstance(df, pd.DataFrame):
            raise TypeError(
                "df must be a pandas DataFrame."
            )

        if not isinstance(is_first_batch, bool):
            raise TypeError(
                "is_first_batch must be a boolean."
            )

        # Start a new batch-training sequence
        if is_first_batch:
            self._pending_batches = []

        if df.empty:
            return None

        required_columns = [
            "track_id",
            *AUDIO_FEATURES
        ]

        missing_columns = [
            col for col in required_columns
            if col not in df.columns
        ]

        if missing_columns:
            raise ValueError(
                f"Missing required columns: {missing_columns}"
            )

        # Store a copy to avoid external modification
        self._pending_batches.append(df.copy())

        return None



    def finalize_incremental_training(self):
      """
      Combine all accumulated batches and train once.

      This is batch accumulation, not true online learning.
      """

      if not self._pending_batches:
          raise ValueError(
              "No pending batches. Call fit_incremental() first."
          )

      combined_df = pd.concat(
          self._pending_batches,
          ignore_index=True
      )

      print("=== FINALIZING BATCH TRAINING ===")
      print(
          "Received batches:",
          len(self._pending_batches)
      )
      print(
          "Total input tracks:",
          len(combined_df)
      )

      # Reuse the existing full training pipeline
      self.fit(combined_df)

      print(
          "Cleaned tracks:",
          len(self.df)
      )
      print(
          "Audio matrix:",
          self.feature_matrix.shape
      )
      print("BATCH TRAINING COMPLETED")

      return self

    def set_genre_matrix(self, genre_matrix, track_ids=None):
        """
        Attach preprocessed genre matrix to the model.

        Parameters
        ----------
        genre_matrix : array-like or sparse matrix
            Preprocessed genre matrix.

        track_ids : array-like, optional
            Track IDs corresponding to each row of genre_matrix.
            Used to validate row ordering.
        """

        if self.df is None:
            raise ValueError("Model has not been fitted.")

        if genre_matrix.shape[0] != len(self.df):
            raise ValueError(
                "Genre matrix and track data have different row counts."
            )

        if track_ids is not None:
            track_ids = list(track_ids)
            model_track_ids = self.df["track_id"].tolist()

            if track_ids != model_track_ids:
                raise ValueError(
                    "Genre matrix Track ID order does not match model data."
                )

        self.genre_matrix = csr_matrix(genre_matrix)

        return self

    # ==========================================
    # 2. INTERNAL HELPERS
    # ==========================================

    def _validate_model(self, require_genre=False, require_artist=False):

        if self.df is None:
            raise ValueError("Model has not been fitted.")

        if self.feature_matrix is None:
            raise ValueError("Audio feature matrix is missing.")

        if require_genre and self.genre_matrix is None:
            raise ValueError("Genre matrix has not been set.")

        if require_artist and "artist_id" not in self.df.columns:
            raise ValueError(
                "Missing required column 'artist_id'. "
                "It is needed when exclude_same_artist=True."
            )

    def _get_track_index(self, track_id):

        if track_id not in self.id_to_idx:
            raise ValueError(
                f"Track ID not found: {track_id}"
            )

        return self.id_to_idx[track_id]

    
    def _get_result(self, indices, scores=None):
        """
        Build recommendation results with track metadata
        and optional recommendation scores.
        """

        metadata_columns = [
            "track_id",
            "track_name",
            "artist_id",
            "artist_name",
            "album_id",
            "album_name",
            "isrc",
            "artist_genres",
            "popularity",
            "explicit",
            "release_year",
            "duration",
        ]

        # Chỉ lấy những cột thực sự tồn tại
        available_columns = [
            col for col in metadata_columns
            if col in self.df.columns
        ]

        result = self.df.iloc[indices][
            available_columns
        ].copy()

        # Bổ sung các điểm similarity
        if scores is not None:
            for column, values in scores.items():
                result[column] = values[indices]

        return result.reset_index(drop=True)


    def _rank_scores(self, scores, top_n, excluded_indices=None):
        scores = np.asarray(scores, dtype=float).copy()

        # Chỉ giữ các điểm số hợp lệ
        valid_mask = np.isfinite(scores)

        # Loại trừ các index được yêu cầu
        if excluded_indices is not None:
            valid_mask[excluded_indices] = False

        # Lấy các index còn hợp lệ
        valid_indices = np.where(valid_mask)[0]

        # Sắp xếp theo điểm số giảm dần
        ranked_indices = valid_indices[
            np.argsort(scores[valid_indices])[::-1]
        ]

        return ranked_indices[:top_n].tolist()
    # ==========================================
    # 3. TRACK SEARCH AND DETAILS
    # ==========================================

    def search_tracks(
        self,
        query,
        limit=20
    ):
        """
        Search tracks by track name or artist name.
        """

        self._validate_model()

        if not isinstance(query, str):
            raise TypeError("Query must be a string.")

        if limit < 1:
            raise ValueError("Limit must be positive.")

        query = query.strip()

        if not query:
            return pd.DataFrame()

        track_match = self.df["track_name"].fillna(
            ""
        ).str.contains(
            query,
            case=False,
            regex=False
        )

        artist_match = self.df["artist_name"].fillna(
            ""
        ).str.contains(
            query,
            case=False,
            regex=False
        )

        result = self.df[
            track_match | artist_match
        ][
            [
                "track_id",
                "track_name",
                "artist_name",
                "artist_genres",
                "popularity"
            ]
        ]

        return result.head(limit).reset_index(drop=True)

    def get_track_details(self, track_id):
        """
        Retrieve metadata and audio features of a track.
        """

        self._validate_model()

        idx = self._get_track_index(track_id)

        return self.df.iloc[idx].to_dict()

    # ==========================================
    # 4. AUDIO-ONLY RECOMMENDATION
    # ==========================================

    
    def recommend_by_track(
        self,
        track_id,
        top_n=10,
        exclude_same_artist=False,
        *,
        top_k=None,
        as_dict=False
    ):
        """
        Recommend tracks using audio feature similarity.

        Supports:
        - top_n: Legacy parameter for notebooks.
        - top_k: Standard parameter for Backend.
        - as_dict: Return list of dictionaries when True.
        """

        self._validate_model(
          require_artist=exclude_same_artist
      )

        # Support both top_n and top_k
        if top_k is not None:
            top_n = top_k

        if not isinstance(top_n, (int, np.integer)) or isinstance(top_n, bool) or top_n < 1:
            raise ValueError("top_n/top_k must be a positive integer.")

        query_idx = self._get_track_index(track_id)

        # Calculate audio similarity
        similarities = cosine_similarity(
            self.feature_matrix[query_idx:query_idx + 1],
            self.feature_matrix
        ).flatten()

        # Exclude original track
        excluded = [query_idx]

        # Optionally exclude tracks from the same artist
        if exclude_same_artist:
            query_artist = self.df.iloc[
                query_idx
            ]["artist_id"]

            same_artist = np.where(
                self.df["artist_id"].to_numpy()
                == query_artist
            )[0]

            excluded.extend(same_artist.tolist())

        # Rank recommendations
        top_indices = self._rank_scores(
            similarities,
            top_n,
            excluded
        )

        # Build result
        result = self._get_result(
            top_indices,
            {"similarity": similarities}
        )

        # Support Backend response format
        if as_dict:
            return result.to_dict(orient="records")

        return result


    # ==========================================
    # 5. HYBRID RECOMMENDATION
    # ==========================================

    
    def recommend_hybrid(
        self,
        track_id,
        top_n=10,
        alpha=0.7,
        exclude_same_artist=True,
        *,
        top_k=None,
        as_dict=False
    ):
        """
        Combine audio and genre similarities.

        alpha:
            0.7 = 70% Audio + 30% Genre

        Supports:
            top_n: Legacy parameter.
            top_k: Backend parameter.
            as_dict: Return list of dictionaries.
        """

        self._validate_model(
          require_genre=True,
          require_artist=exclude_same_artist
      )

        # Support both top_n and top_k
        if top_k is not None:
            top_n = top_k

        if not isinstance(top_n, (int, np.integer)) or isinstance(top_n, bool) or top_n < 1:
            raise ValueError("top_n/top_k must be a positive integer.")

        if not 0 <= alpha <= 1:
            raise ValueError("Alpha must be between 0 and 1.")

        query_idx = self._get_track_index(track_id)

        # Audio similarity
        audio_similarity = cosine_similarity(
            self.feature_matrix[query_idx:query_idx + 1],
            self.feature_matrix
        ).flatten()

        # Genre similarity
        genre_similarity = cosine_similarity(
            self.genre_matrix[query_idx],
            self.genre_matrix
        ).flatten()

        # Hybrid similarity
        hybrid_similarity = (
            alpha * audio_similarity
            + (1 - alpha) * genre_similarity
        )

        # Exclude original track and optionally same artist
        excluded = [query_idx]

        if exclude_same_artist:
            query_artist = self.df.iloc[
                query_idx
            ]["artist_id"]

            same_artist = np.where(
                self.df["artist_id"].to_numpy()
                == query_artist
            )[0]

            excluded.extend(same_artist.tolist())

        # Rank recommendations
        top_indices = self._rank_scores(
            hybrid_similarity,
            top_n,
            excluded
        )

        # Build result
        result = self._get_result(
            top_indices,
            {
                "audio_similarity": audio_similarity,
                "genre_similarity": genre_similarity,
                "hybrid_similarity": hybrid_similarity
            }
        )

        if as_dict:
            return result.to_dict(orient="records")

        return result


    # ==========================================
    # 6. HYBRID + MMR
    # ==========================================


    def recommend_hybrid_mmr(
        self,
        track_id,
        top_n=10,
        alpha=0.7,
        mmr_lambda=0.7,
        candidate_pool=50,
        exclude_same_artist=True,
        *,
        top_k=None,
        as_dict=False
    ):
        """
        Hybrid recommendation with Maximal Marginal Relevance.

        MMR balances relevance and diversity.

        Parameters:
            top_n: Legacy parameter.
            top_k: Backend parameter.
            alpha: Audio/Genre weighting.
            mmr_lambda: Relevance/Diversity weighting.
            candidate_pool: Number of initial candidates.
            exclude_same_artist: Exclude query artist.
            as_dict: Return list of dictionaries.
        """

        self._validate_model(
          require_genre=True,
          require_artist=exclude_same_artist
      )

        # Support both top_n and top_k
        if top_k is not None:
            top_n = top_k

        if not isinstance(top_n, (int, np.integer)) or isinstance(top_n, bool) or top_n < 1:
            raise ValueError("top_n/top_k must be a positive integer.")

        if not isinstance(candidate_pool, (int, np.integer)) or isinstance(candidate_pool, bool) or candidate_pool < 1:
            raise ValueError("candidate_pool must be a positive integer.")

        if not 0 <= alpha <= 1:
            raise ValueError("Alpha must be between 0 and 1.")

        if not 0 <= mmr_lambda <= 1:
            raise ValueError("MMR lambda must be between 0 and 1.")

        query_idx = self._get_track_index(track_id)

        # 1. Audio similarity
        audio_similarity = cosine_similarity(
            self.feature_matrix[query_idx:query_idx + 1],
            self.feature_matrix
        ).flatten()

        # 2. Genre similarity
        genre_similarity = cosine_similarity(
            self.genre_matrix[query_idx],
            self.genre_matrix
        ).flatten()

        # 3. Hybrid similarity
        hybrid_similarity = (
            alpha * audio_similarity
            + (1 - alpha) * genre_similarity
        )

        # 4. Exclude original track and optionally same artist
        excluded = [query_idx]

        if exclude_same_artist:
            query_artist = self.df.iloc[
                query_idx
            ]["artist_id"]

            same_artist = np.where(
                self.df["artist_id"].to_numpy()
                == query_artist
            )[0]

            excluded.extend(same_artist.tolist())

        # 5. Select candidate pool
        candidates = self._rank_scores(
            hybrid_similarity,
            candidate_pool,
            excluded
        )

        if not candidates:
            return [] if as_dict else pd.DataFrame()

        # 6. Calculate pairwise similarity
        audio_pairwise = cosine_similarity(
            self.feature_matrix[candidates]
        )

        genre_pairwise = cosine_similarity(
            self.genre_matrix[candidates]
        )

        pairwise_similarity = (
            alpha * audio_pairwise
            + (1 - alpha) * genre_pairwise
        )

        # 7. Greedy MMR selection
        selected = []
        selected_scores = []

        remaining = list(range(len(candidates)))

        while remaining and len(selected) < top_n:

            best_position = None
            best_score = -np.inf

            for pos in remaining:

                relevance = hybrid_similarity[
                    candidates[pos]
                ]

                if selected:
                    redundancy = max(
                        pairwise_similarity[pos, previous]
                        for previous in selected
                    )
                else:
                    redundancy = 0

                score = (
                    mmr_lambda * relevance
                    - (1 - mmr_lambda) * redundancy
                )

                if score > best_score:
                    best_score = score
                    best_position = pos

            selected.append(best_position)
            selected_scores.append(best_score)

            remaining.remove(best_position)

        # 8. Build result
        selected_indices = [
            candidates[pos] for pos in selected
        ]

        result = self._get_result(
            selected_indices,
            {
                "audio_similarity": audio_similarity,
                "genre_similarity": genre_similarity,
                "hybrid_similarity": hybrid_similarity
            }
        )

        result["mmr_score"] = selected_scores

        if as_dict:
            return result.to_dict(orient="records")

        return result



    # ==========================================
    # 7. TASTE PROFILE RECOMMENDATION
    # ==========================================

    def recommend_by_taste_profile(
        self,
        track_ids,
        top_n=10,
        alpha=0.7,
        exclude_same_artist=False,
        *,
        top_k=None,
        as_dict=False
    ):
        """
        Recommend tracks based on multiple
        favorite tracks supplied by the user.

        Supports:
            top_n: Legacy Notebook parameter.
            top_k: Backend API parameter.
            as_dict: Return list of dictionaries.
        """

        self._validate_model(
          require_genre=True,
          require_artist=exclude_same_artist
      )

        # Support both top_n and top_k
        if top_k is not None:
            top_n = top_k

        if (
            not isinstance(top_n, (int, np.integer))
            or isinstance(top_n, bool)
            or top_n < 1
        ):
            raise ValueError(
                "top_n/top_k must be a positive integer."
            )

        if isinstance(track_ids, str):
            track_ids = [track_ids]

        if not track_ids:
            raise ValueError(
                "At least one track ID is required."
            )

        if not 0 <= alpha <= 1:
            raise ValueError(
                "Alpha must be between 0 and 1."
            )

        seed_indices = list(dict.fromkeys(
            self._get_track_index(track_id)
            for track_id in track_ids
        ))

        # Average audio preference
        audio_profile = np.asarray(
            self.feature_matrix[seed_indices].mean(axis=0)
        ).reshape(1, -1)

        audio_similarity = cosine_similarity(
            audio_profile,
            self.feature_matrix
        ).flatten()

        # Average genre preference
        genre_profile = csr_matrix(
            self.genre_matrix[seed_indices].mean(axis=0)
        )

        genre_similarity = cosine_similarity(
            genre_profile,
            self.genre_matrix
        ).flatten()

        # Hybrid similarity
        hybrid_similarity = (
            alpha * audio_similarity
            + (1 - alpha) * genre_similarity
        )

        # Exclude original tracks
        excluded = list(seed_indices)

        # Exclude tracks from seed artists
        if exclude_same_artist:
            seed_artists = self.df.iloc[
                seed_indices
            ]["artist_id"].unique()

            same_artist = np.where(
                self.df["artist_id"].isin(
                    seed_artists
                ).to_numpy()
            )[0]

            excluded.extend(same_artist.tolist())

        # Rank recommendations
        top_indices = self._rank_scores(
            hybrid_similarity,
            top_n,
            excluded
        )

        result = self._get_result(
            top_indices,
            {
                "audio_similarity": audio_similarity,
                "genre_similarity": genre_similarity,
                "hybrid_similarity": hybrid_similarity
            }
        )

        if as_dict:
            return result.to_dict(orient="records")

        return result


    # ==========================================
    # 8. MOOD-BASED RECOMMENDATION
    # ==========================================

    def recommend_by_mood(
        self,
        mood,
        top_n=10,
        *,
        top_k=None,
        as_dict=False
    ):
        """
        Recommend tracks based on a predefined audio profile
        representing the requested mood.

        Supported moods:
            happy, sad, calm, energetic, focus

        Supports:
            top_n: Legacy Notebook parameter.
            top_k: Backend parameter.
            as_dict: Return list of dictionaries.
        """

        self._validate_model()

        # Support both top_n and top_k
        if top_k is not None:
            top_n = top_k

        if (
            not isinstance(top_n, (int, np.integer))
            or isinstance(top_n, bool)
            or top_n < 1
        ):
            raise ValueError(
                "top_n/top_k must be a positive integer."
            )

        if not isinstance(mood, str):
            raise TypeError("Mood must be a string.")

        mood = mood.strip().lower()

        # Representative audio profiles.
        # Values follow the original Spotify audio feature scales.
        mood_profiles = {
            "happy": {
                "danceability": 0.80,
                "energy": 0.80,
                "valence": 0.85,
                "tempo": 120.0,
                "acousticness": 0.15,
                "instrumentalness": 0.05,
                "speechiness": 0.08,
                "liveness": 0.15,
                "loudness": -5.0
            },

            "sad": {
                "danceability": 0.40,
                "energy": 0.25,
                "valence": 0.20,
                "tempo": 75.0,
                "acousticness": 0.65,
                "instrumentalness": 0.10,
                "speechiness": 0.05,
                "liveness": 0.15,
                "loudness": -18.0
            },

            "calm": {
                "danceability": 0.35,
                "energy": 0.25,
                "valence": 0.45,
                "tempo": 85.0,
                "acousticness": 0.80,
                "instrumentalness": 0.35,
                "speechiness": 0.04,
                "liveness": 0.12,
                "loudness": -18.0
            },

            "energetic": {
                "danceability": 0.75,
                "energy": 0.90,
                "valence": 0.65,
                "tempo": 140.0,
                "acousticness": 0.10,
                "instrumentalness": 0.05,
                "speechiness": 0.08,
                "liveness": 0.20,
                "loudness": -5.0
            },

            "focus": {
                "danceability": 0.30,
                "energy": 0.30,
                "valence": 0.25,
                "tempo": 95.0,
                "acousticness": 0.55,
                "instrumentalness": 0.85,
                "speechiness": 0.03,
                "liveness": 0.12,
                "loudness": -17.0
            }
        }

        if mood not in mood_profiles:
            supported_moods = ", ".join(mood_profiles.keys())

            raise ValueError(
                f"Unsupported mood: '{mood}'. "
                f"Supported moods: {supported_moods}"
            )

        # Convert the target profile into the same
        # standardized feature space as the trained model.
        target_df = pd.DataFrame(
            [mood_profiles[mood]],
            columns=AUDIO_FEATURES
        )

        target_vector = self.scaler.transform(target_df)

        # Calculate cosine similarity against all tracks.
        similarities = cosine_similarity(
            target_vector,
            self.feature_matrix
        ).flatten()

        # Rank tracks by mood similarity.
        top_indices = self._rank_scores(
            similarities,
            top_n
        )

        result = self._get_result(
            top_indices,
            {"mood_similarity": similarities}
        )

        if as_dict:
            return result.to_dict(orient="records")

        return result

    
    # ==========================================
    # 8. POPULARITY-BASED BASELINE
    # ==========================================

    def recommend_by_popularity(
        self,
        top_n=10,
        exclude_track_ids=None,
        *,
        top_k=None,
        as_dict=False
    ):
        """
        Popularity-based baseline for comparison.

        Supports:
            top_n: Legacy Notebook parameter.
            top_k: Backend API parameter.
            as_dict: Return list of dictionaries.
        """

        self._validate_model()

        # Support both top_n and top_k
        if top_k is not None:
            top_n = top_k

        if (
            not isinstance(top_n, (int, np.integer))
            or isinstance(top_n, bool)
            or top_n < 1
        ):
            raise ValueError(
                "top_n/top_k must be a positive integer."
            )

        if isinstance(exclude_track_ids, str):
            exclude_track_ids = [exclude_track_ids]

        excluded = set(exclude_track_ids or [])

        candidates = self.df[
            ~self.df["track_id"].isin(excluded)
        ].copy()

        candidates = candidates.sort_values(
            "popularity",
            ascending=False
        )

        # Lấy index của các bài hát sau khi sắp xếp popularity
        top_indices = candidates.head(top_n).index.tolist()

        # Sử dụng chung helper để tạo recommendation response
        result = self._get_result(top_indices)

        if as_dict:
            return result.to_dict(orient="records")

        return result

    
    # ==========================================
    # 9. MODEL SERIALIZATION
    # ==========================================

    def save_artifact(self, path):
        """
        Save the complete trained model.
        """

        self._validate_model(require_genre=True)

        path = Path(path)
        path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        artifact = {
            "version": 1,
            "model": self
        }

        joblib.dump(
            artifact,
            path,
            compress=3
        )

        print(f"Model saved successfully: {path}")

        return path

    @classmethod
    def load_artifact(cls, path):
        """
        Load a previously saved model.
        """

        path = Path(path)

        if not path.exists():
            raise FileNotFoundError(
                f"Artifact not found: {path}"
            )

        artifact = joblib.load(path)

        if artifact.get("version") != 1:
            raise ValueError(
                "Unsupported model artifact version."
            )

        model = artifact.get("model")

        if not isinstance(model, cls):
            raise TypeError(
                "Invalid model artifact."
            )

        model._validate_model(require_genre=True)

        return model



