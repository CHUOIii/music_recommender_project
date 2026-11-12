
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const API_BASE = (
    localStorage.getItem("embeat_api_base") ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  const MOODS = {
    happy: "Vui vẻ",
    sad: "Tâm trạng",
    calm: "Êm dịu",
    chill: "Thư giãn",
    energetic: "Sôi động",
    focus: "Tập trung"
  };

  const FEATURES = [
    "danceability",
    "energy",
    "valence",
    "tempo",
    "acousticness",
    "instrumentalness",
    "liveness",
    "speechiness",
    "loudness"
  ];

  const state = {
    favorites: [],
    selected: null,
    seed: null,
    compared: null,
    chart: null,
    chartTracks: [],
    requestId: 0,
    results: []
  };

  const coverCache = new Map();
  let toastTimer = null;

  // UTILITIES

  function trackName(track) {
    return track?.track_name || "Không rõ tên";
  }

  function artistName(track) {
    return track?.artist_name || "Không rõ nghệ sĩ";
  }

  function notify(message, error = false) {
    const toast = $("toast");
    if (!toast) return;

    clearTimeout(toastTimer);

    toast.textContent = message;
    toast.className = error
      ? "toast show error"
      : "toast show";

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }

  function setResults(title, description, count = 0) {
    $("resultsTitle").textContent = title;
    $("resultsDescription").textContent = description;
    $("resultCount").textContent = `${count} bài hát`;
  }

  function showMessage(message, loading = false) {
    const container = $("recommendationsList");
    container.replaceChildren();

    const box = document.createElement("div");
    box.className = "empty";

    const title = document.createElement("h3");
    title.textContent = loading
      ? "Đang tải dữ liệu..."
      : "Thông báo";

    const paragraph = document.createElement("p");
    paragraph.textContent = message;

    box.append("♫", title, paragraph);
    container.appendChild(box);
  }

  function clearMood() {
    document.querySelectorAll(".mood").forEach((button) => {
      button.classList.remove("active");
    });
  }

  function switchView(viewName) {
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle(
        "hidden",
        view.id !== viewName
      );
    });

    document.querySelectorAll(".nav-btn").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.view === viewName
      );
    });

    if (viewName === "favorites") {
      renderFavorites();
    }

    if (viewName === "analysis") {
      requestAnimationFrame(() => {
        state.chart?.resize();
      });
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // API

  async function api(path, options = {}) {
    let response;

    try {
      response = await fetch(API_BASE + path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });
    } catch {
      throw new Error(
        "Không kết nối được Backend tại " + API_BASE
      );
    }

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Backend không trả về JSON hợp lệ."
      );
    }

    if (!response.ok) {
      let detail = data.detail || `HTTP ${response.status}`;

      if (Array.isArray(detail)) {
        detail = detail.map((item) =>
          item.msg || String(item)
        ).join("; ");
      }

      throw new Error(String(detail));
    }

    return data;
  }

  async function checkHealth() {
    const label = $("serverStatus");
    const dot = document.querySelector(".status-dot");

    if (!label || !dot) return;

    try {
      const data = await api("/api/v1/health");

      if (data.model_loaded === true) {
        label.textContent = "Backend & AI đã kết nối";
        dot.className = "status-dot online";
      } else {
        label.textContent = "AI chưa sẵn sàng";
        dot.className = "status-dot offline";
      }
    } catch {
      label.textContent = "Backend chưa kết nối";
      dot.className = "status-dot offline";
    }
  }

  async function requestRecommendations(
    title,
    description,
    callback,
    mode
  ) {
    const requestId = ++state.requestId;

    setResults(title, description);
    showMessage("Đang lấy dữ liệu từ AI...", true);
    $("resultCount").textContent = "Đang tải...";

    try {
      const data = await callback();

      if (requestId !== state.requestId) {
        return null;
      }

      if (
        !data ||
        !Array.isArray(data.recommendations)
      ) {
        throw new Error(
          "Dữ liệu gợi ý từ Backend không hợp lệ."
        );
      }

      renderTracks(data.recommendations, mode);
      return data;
    } catch (error) {
      if (requestId !== state.requestId) {
        return null;
      }

      showMessage(error.message);
      $("resultCount").textContent = "Có lỗi";

      notify(error.message, true);
      checkHealth();

      return null;
    }
  }

  // FAVORITES

  function loadFavorites() {
    try {
      const saved = JSON.parse(
        localStorage.getItem("embeat_favorites") || "[]"
      );

      state.favorites = Array.isArray(saved)
        ? saved.filter((track) => track?.track_id)
        : [];
    } catch {
      state.favorites = [];
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(
        "embeat_favorites",
        JSON.stringify(state.favorites)
      );
    } catch {
      notify("Không lưu được thư viện yêu thích.", true);
    }
  }

  function isFavorite(track) {
    return state.favorites.some(
      (item) => item.track_id === track?.track_id
    );
  }

  function refreshFavoriteButtons() {
    document.querySelectorAll(
      "[data-favorite-id]"
    ).forEach((button) => {
      const active = state.favorites.some(
        (track) =>
          track.track_id === button.dataset.favoriteId
      );

      button.textContent = active ? "♥" : "♡";
      button.classList.toggle("accent", active);
      button.title = active
        ? "Bỏ yêu thích"
        : "Thêm yêu thích";
    });
  }

  function toggleFavorite(track) {
    if (!track?.track_id) return;

    if (isFavorite(track)) {
      state.favorites = state.favorites.filter(
        (item) => item.track_id !== track.track_id
      );

      notify("Đã bỏ bài hát khỏi yêu thích.");
    } else {
      state.favorites.push(track);
      notify("Đã thêm bài hát vào yêu thích.");
    }

    saveFavorites();
    renderFavorites();
    refreshFavoriteButtons();
  }

  function renderFavorites() {
    const container = $("favoritesList");
    container.replaceChildren();

    $("favoriteCount").textContent =
      `${state.favorites.length} bài hát`;

    if (!state.favorites.length) {
      const box = document.createElement("div");
      box.className = "empty";

      const title = document.createElement("h3");
      title.textContent = "Thư viện đang trống";

      const paragraph = document.createElement("p");
      paragraph.textContent =
        "Hãy lưu các bài hát bạn yêu thích.";

      box.append(title, paragraph);
      container.appendChild(box);
      return;
    }

    state.favorites.forEach((track, index) => {
      container.appendChild(
        createTrackCard(track, index, "favorite")
      );
    });
  }

  // SPOTIFY COVER

  function getSpotifyTrackId(track) {
    const id = String(track?.track_id || "");
    return /^[A-Za-z0-9]{22}$/.test(id)
      ? id
      : null;
  }

  function getAlbumCover(track) {
    const id = getSpotifyTrackId(track);

    if (!id) {
      return Promise.resolve(null);
    }

    if (!coverCache.has(id)) {
      const request = fetch(
        "https://open.spotify.com/oembed?url=" +
        encodeURIComponent(
          `https://open.spotify.com/track/${id}`
        )
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Spotify oEmbed error");
          }

          return response.json();
        })
        .then((data) => {
          const url = data?.thumbnail_url;
          if (!url) return null;

          const parsed = new URL(url);

          return parsed.protocol === "https:"
            ? parsed.href
            : null;
        })
        .catch(() => null);

      coverCache.set(id, request);
    }

    return coverCache.get(id);
  }

  function setAlbumCover(element, track) {
    if (!element) return;

    const requestedId = String(
      track?.track_id || ""
    );

    element.dataset.coverTrack = requestedId;
    element.replaceChildren();
    element.textContent = "♫";

    getAlbumCover(track).then((url) => {
      if (!url) return;

      if (
        element.dataset.coverTrack !== requestedId
      ) {
        return;
      }

      const image = new Image();

      image.alt = `Ảnh bìa ${trackName(track)}`;
      image.decoding = "async";
      image.loading = "eager";

      image.onload = () => {
        if (
          element.dataset.coverTrack === requestedId
        ) {
          element.replaceChildren(image);
        }
      };

      image.onerror = () => {
        if (
          element.dataset.coverTrack === requestedId
        ) {
          element.textContent = "♫";
        }
      };

      image.src = url;
    });
  }

  // TRACK CARDS

  function createButton(
    text,
    title,
    handler,
    accent = false
  ) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = accent
      ? "mini-btn accent"
      : "mini-btn";

    button.textContent = text;
    button.title = title;
    button.addEventListener("click", handler);

    return button;
  }

  function createTrackCard(track, index, mode) {
    const card = document.createElement("div");
    card.className = "track";

    const rank = document.createElement("span");
    rank.className = "track-rank";
    rank.textContent = String(index + 1).padStart(2, "0");

    const artwork = document.createElement("div");
    artwork.className = "track-art";
    setAlbumCover(artwork, track);

    const info = document.createElement("div");
    info.className = "track-info";

    const name = document.createElement("div");
    name.className = "track-name";
    name.textContent = trackName(track);
    name.title = trackName(track);

    const meta = document.createElement("div");
    meta.className = "track-meta";

    const score = Number(track.similarity_score);
    const hasScore =
      track.similarity_score != null &&
      Number.isFinite(score);

    const popularity = Number(track.popularity);
    const hasPopularity =
      track.popularity != null &&
      Number.isFinite(popularity);

    let description = artistName(track);

    if (
      hasScore &&
      mode !== "search" &&
      mode !== "popular"
    ) {
      description +=
        ` • Match ${(score * 100).toFixed(1)}%`;
    } else if (hasPopularity) {
      description +=
        ` • Popularity ${popularity}`;
    }

    meta.textContent = description;
    info.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "track-actions";

    const playButton = createButton(
      "▶ Nghe",
      "Nghe trên Spotify",
      () => playTrack(track)
    );

    const favoriteButton = createButton(
      isFavorite(track) ? "♥" : "♡",
      isFavorite(track)
        ? "Bỏ yêu thích"
        : "Thêm yêu thích",
      () => toggleFavorite(track),
      isFavorite(track)
    );

    favoriteButton.dataset.favoriteId =
      track.track_id;

    const recommendButton = createButton(
      "✦ Gợi ý AI",
      "Gợi ý bài tương tự",
      () => recommendTrack(track)
    );

    const compareButton = createButton(
      "◈ So sánh",
      "Phân tích đặc trưng âm nhạc",
      () => compareTrack(track)
    );

    actions.append(
      playButton,
      favoriteButton,
      recommendButton,
      compareButton
    );

    card.append(
      rank,
      artwork,
      info,
      actions
    );

    return card;
  }

  function renderTracks(tracks, mode = "search") {
    const container = $("recommendationsList");
    container.replaceChildren();

    state.results = tracks;

    $("resultCount").textContent =
      `${tracks.length} bài hát`;

    if (!tracks.length) {
      showMessage("Không tìm thấy bài hát phù hợp.");
      return;
    }

    tracks.forEach((track, index) => {
      container.appendChild(
        createTrackCard(track, index, mode)
      );
    });
  }

  // SPOTIFY PLAYER

  function getEmbedUrl(track) {
    const id = getSpotifyTrackId(track);

    if (id) {
      return `https://open.spotify.com/embed/track/${id}`;
    }

    const provided = track?.spotify_embed_url;

    if (!provided) return null;

    try {
      const url = new URL(provided);

      if (
        url.protocol === "https:" &&
        url.hostname === "open.spotify.com" &&
        url.pathname.startsWith("/embed/track/")
      ) {
        return url.href;
      }
    } catch {
      return null;
    }

    return null;
  }

  function playTrack(track) {
    if (!track) return;

    state.selected = track;

    $("nowPlayingTitle").textContent =
      trackName(track);

    $("nowPlayingArtist").textContent =
      artistName(track);

    const popularity = Number(track.popularity);

    $("nowPlayingPopularity").textContent =
      Number.isFinite(popularity) &&
      track.popularity != null
        ? `Popularity: ${popularity}`
        : "";

    setAlbumCover(
      $("nowPlayingCover"),
      track
    );

    const player = $("spotifyPlayer");
    const embedUrl = getEmbedUrl(track);

    if (embedUrl) {
      player.src = embedUrl;
      player.classList.add("loaded");
    } else {
      player.removeAttribute("src");
      player.classList.remove("loaded");

      notify(
        "Bài hát này chưa có Spotify Player hợp lệ.",
        true
      );
    }

    $("recommendCurrent").disabled = false;
  }

  // POPULAR

  async function loadPopular() {
    clearMood();

    return requestRecommendations(
      "Khám phá âm nhạc",
      "Top 10 bài hát phổ biến dành cho bạn.",
      () => api("/api/v1/recommend/popular?k=10"),
      "popular"
    );
  }

  // SEARCH

  async function searchTracks() {
    const query = $("searchInput").value.trim();

    if (!query) {
      notify(
        "Vui lòng nhập tên bài hát hoặc nghệ sĩ.",
        true
      );

      $("searchInput").focus();
      return;
    }

    clearMood();
    switchView("home");

    const requestId = ++state.requestId;

    setResults(
      `Kết quả tìm kiếm: ${query}`,
      "Các bài hát phù hợp với từ khóa."
    );

    showMessage("Đang tìm kiếm...", true);
    $("resultCount").textContent = "Đang tải...";

    try {
      const data = await api(
        `/api/v1/search?q=${encodeURIComponent(query)}&limit=15`
      );

      if (requestId !== state.requestId) return;

      const tracks = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data.tracks)
            ? data.tracks
            : Array.isArray(data.items)
              ? data.items
              : null;

      if (!tracks) {
        throw new Error(
          "Dữ liệu tìm kiếm từ Backend không hợp lệ."
        );
      }

      renderTracks(tracks, "search");
    } catch (error) {
      if (requestId !== state.requestId) return;

      showMessage(error.message);
      $("resultCount").textContent = "Có lỗi";

      notify(error.message, true);
      checkHealth();
    }
  }

  // TRACK RECOMMENDATION

  async function recommendTrack(track) {
    if (!track?.track_id) {
      notify(
        "Bài hát không có Track ID hợp lệ.",
        true
      );
      return;
    }

    switchView("home");
    clearMood();

    state.seed = track;
    state.compared = null;
    updateAnalysis();

    await requestRecommendations(
      `Gợi ý từ: ${trackName(track)}`,
      `AI tìm các bài hát tương tự ${trackName(track)}.`,
      () => api(
        `/api/v1/recommend/track/${encodeURIComponent(
          track.track_id
        )}?k=10&strategy=hybrid`
      ),
      "recommendation"
    );
  }

  // MOOD RECOMMENDATION

  async function recommendMood(mood) {
    if (!Object.prototype.hasOwnProperty.call(MOODS, mood)) {
      notify("Tâm trạng không hợp lệ.", true);
      return;
    }

    switchView("home");

    state.seed = null;
    state.compared = null;
    updateAnalysis();

    document.querySelectorAll(".mood").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.mood === mood
      );
    });

    await requestRecommendations(
      `Âm nhạc: ${MOODS[mood]}`,
      "Gợi ý âm nhạc theo tâm trạng.",
      () => api(
        `/api/v1/recommend/mood/${mood}?k=10`
      ),
      "mood"
    );
  }

  // TASTE PROFILE

  async function recommendProfile() {
    const trackIds = [
      ...new Set(
        state.favorites
          .map((track) => track.track_id)
          .filter(Boolean)
      )
    ].slice(0, 50);

    if (trackIds.length < 2) {
      notify(
        "Cần ít nhất 2 bài yêu thích để tạo Taste Profile.",
        true
      );
      return;
    }

    switchView("home");
    clearMood();

    state.seed = null;
    state.compared = null;
    updateAnalysis();

    const data = await requestRecommendations(
      "Gợi ý theo gu âm nhạc",
      `AI phân tích ${trackIds.length} bài hát yêu thích.`,
      () => api("/api/v1/recommend/profile", {
        method: "POST",
        body: JSON.stringify({
          track_ids: trackIds,
          k: 10,
          alpha: 0.7,
          exclude_same_artist: false
        })
      }),
      "profile"
    );

    if (data) {
      notify("Đã tạo Taste Profile bằng AI.");
    }
  }

  // AUDIO FEATURES

  function rawFeature(track, key) {
    const value = track?.audio_features?.[key];

    if (value == null || value === "") {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  function normalizeFeature(key, value) {
    if (value == null) return null;

    let result = value;

    if (key === "tempo") {
      result = value / 250;
    }

    if (key === "loudness") {
      result = (value + 60) / 60;
    }

    return Math.max(
      0,
      Math.min(1, result)
    );
  }

  function displayFeature(track, key) {
    const value = rawFeature(track, key);

    if (value == null) return "—";

    if (key === "tempo") {
      return `${value.toFixed(1)} BPM`;
    }

    if (key === "loudness") {
      return `${value.toFixed(1)} dB`;
    }

    return value.toFixed(3);
  }

  function hasAudioFeatures(track) {
    return FEATURES.some(
      (key) => rawFeature(track, key) !== null
    );
  }

  function chartDataset(track, color, background) {
    return {
      label: `${trackName(track)} — ${artistName(track)}`,
      data: FEATURES.map((key) =>
        normalizeFeature(
          key,
          rawFeature(track, key)
        )
      ),
      borderColor: color,
      backgroundColor: background,
      pointBackgroundColor: color,
      pointBorderColor: color,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: true,
      spanGaps: false
    };
  }

  // RADAR CHART

  function initializeChart() {
    const canvas = $("audioFeaturesChart");

    if (!canvas || !window.Chart) {
      notify("Không tải được Chart.js.", true);
      return;
    }

    state.chart = new Chart(canvas, {
      type: "radar",
      data: {
        labels: FEATURES.map(
          (key) =>
            key.charAt(0).toUpperCase() +
            key.slice(1)
        ),
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 1,
            beginAtZero: true,
            grid: {
              color: "#30394c"
            },
            angleLines: {
              color: "#30394c"
            },
            pointLabels: {
              color: "#c8d1e0",
              font: {
                size: 10
              }
            },
            ticks: {
              display: false,
              stepSize: 0.2
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              color: "#e2e8f0",
              padding: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const key = FEATURES[context.dataIndex];
                const track =
                  state.chartTracks[context.datasetIndex];

                return `${key}: ${displayFeature(track, key)}`;
              }
            }
          }
        }
      }
    });
  }

  function updateAnalysis() {
    const seed = state.seed;
    const compared = state.compared;

    $("seedTrackLabel").textContent = seed
      ? `${trackName(seed)} — ${artistName(seed)}`
      : "Chưa chọn bài gốc";

    $("compareTrackLabel").textContent = compared
      ? `${trackName(compared)} — ${artistName(compared)}`
      : "Chưa chọn bài so sánh";

    const details = $("featureDetails");
    details.replaceChildren();

    const header = document.createElement("div");
    header.className = "feature-row feature-header";

    [
      "Đặc trưng",
      "Bài gốc",
      "Bài so sánh"
    ].forEach((value) => {
      const cell = document.createElement("span");
      cell.textContent = value;
      header.appendChild(cell);
    });

    details.appendChild(header);

    if (
      (seed && !hasAudioFeatures(seed)) ||
      (compared && !hasAudioFeatures(compared))
    ) {
      const warning = document.createElement("p");
      warning.className = "feature-warning";
      warning.textContent =
        "Một bài hát không có audio features từ Backend.";

      details.appendChild(warning);
    }

    FEATURES.forEach((key) => {
      const row = document.createElement("div");
      row.className = "feature-row";

      const label = document.createElement("span");
      label.textContent = key;

      const first = document.createElement("b");
      first.textContent = displayFeature(seed, key);

      const second = document.createElement("b");
      second.textContent = displayFeature(compared, key);

      row.append(label, first, second);
      details.appendChild(row);
    });

    if (!state.chart) return;

    const datasets = [];
    const chartTracks = [];

    if (seed && hasAudioFeatures(seed)) {
      datasets.push(
        chartDataset(
          seed,
          "#43e3a0",
          "rgba(67,227,160,0.17)"
        )
      );

      chartTracks.push(seed);
    }

    if (
      compared &&
      hasAudioFeatures(compared) &&
      compared.track_id !== seed?.track_id
    ) {
      datasets.push(
        chartDataset(
          compared,
          "#a98bff",
          "rgba(169,139,255,0.17)"
        )
      );

      chartTracks.push(compared);
    }

    state.chartTracks = chartTracks;
    state.chart.data.datasets = datasets;
    state.chart.update();
  }

  function compareTrack(track) {
    if (!track) return;

    if (!state.seed) {
      state.seed = state.selected || track;
    }

    if (state.seed.track_id === track.track_id) {
      state.compared = null;

      notify(
        "Đã chọn bài gốc. Hãy chọn bài khác để so sánh."
      );
    } else {
      state.compared = track;
    }

    updateAnalysis();
    switchView("analysis");
  }

  // NAVIGATION

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();

      const view = button.dataset.view;

      if (view === "home") {
        switchView("home");
        loadPopular();
      } else {
        state.requestId++;
        switchView(view);
      }
    });
  });

  // SEARCH EVENTS

  $("searchBtn").addEventListener(
    "click",
    searchTracks
  );

  $("searchInput").addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") {
        searchTracks();
      }
    }
  );

  // MOOD EVENTS

  document.querySelectorAll(".mood").forEach((button) => {
    button.addEventListener("click", () => {
      recommendMood(button.dataset.mood);
    });
  });

  // FAVORITES EVENTS

  $("generateProfile").addEventListener(
    "click",
    recommendProfile
  );

  $("clearFavorites").addEventListener("click", () => {
    if (!state.favorites.length) return;

    if (!confirm("Xóa tất cả bài hát yêu thích?")) {
      return;
    }

    state.favorites = [];

    saveFavorites();
    renderFavorites();
    refreshFavoriteButtons();

    notify("Đã xóa thư viện yêu thích.");
  });

  // PLAYER EVENTS

  $("recommendCurrent").addEventListener(
    "click",
    () => {
      if (state.selected) {
        recommendTrack(state.selected);
      }
    }
  );

  // INITIALIZATION

  loadFavorites();
  renderFavorites();

  initializeChart();
  updateAnalysis();

  loadPopular();
  checkHealth();
});
