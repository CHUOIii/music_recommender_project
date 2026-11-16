
window.onSpotifyIframeApiReady = IFrameAPI => {
  window.__embeatSpotifyAPI = IFrameAPI;
  document.dispatchEvent(new Event("embeat:spotify-ready"));
};

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = id => document.getElementById(id);

  const API_BASE = (() => {
    try {
      return localStorage.getItem("embeat_api_base") ||
        "http://127.0.0.1:8000";
    } catch {
      return "http://127.0.0.1:8000";
    }
  })().replace(/\/+$/, "");

  const KEYS = {
    favorites: "embeat_favorites",
    queue: "embeat_queue",
    radar: "embeat_radar_selection"
  };

  const MOODS = {
    happy: "Vui vẻ",
    sad: "Tâm trạng",
    energetic: "Sôi động",
    chill: "Thư giãn",
    calm: "Êm dịu",
    focus: "Tập trung"
  };

  const FEATURES = [
    ["danceability", "Danceability"],
    ["energy", "Energy"],
    ["valence", "Valence"],
    ["tempo", "Tempo"],
    ["acousticness", "Acousticness"],
    ["instrumentalness", "Instrumentalness"],
    ["liveness", "Liveness"],
    ["speechiness", "Speechiness"],
    ["loudness", "Loudness"]
  ];

  const HIGHLIGHTS = [
    ["energy", "Năng lượng"],
    ["danceability", "Nhịp điệu"],
    ["valence", "Cảm xúc"],
    ["acousticness", "Acoustic"],
    ["tempo", "Tempo"]
  ];

  const COLORS = [
    "#52e3af", "#ae96ff", "#ff9bba",
    "#ffc86a", "#69c6ff", "#fd9368",
    "#d6e377", "#aaebfa", "#e68cf8", "#84b1ff"
  ];

  // =========================
  // STORAGE
  // =========================

  function readStorage(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function store(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      toast("Không thể lưu dữ liệu trên trình duyệt.", true);
    }
  }

  function safe(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function nameOf(t) {
    return t?.track_name || t?.name || "Không rõ tên";
  }

  function artistOf(t) {
    return t?.artist_name || t?.artist || "Không rõ nghệ sĩ";
  }

  function idOf(t) {
    return String(t?.track_id || "");
  }

  function normalizeTrack(item) {
    if (!item || typeof item !== "object") return null;

    return item.track && !item.track_id
      ? {
          ...item.track,
          ...item,
          track_id: item.track.track_id
        }
      : item;
  }

  function unique(items) {
    const seen = new Set();

    return items.map(normalizeTrack).filter(t => {
      const id = idOf(t);

      if (!id || seen.has(id)) return false;

      seen.add(id);
      return true;
    });
  }

  function normalizeStoredTracks(key) {
    return unique(
      readStorage(key).filter(
        x => x && typeof x === "object"
      )
    );
  }

  const initialRadar = readStorage(KEYS.radar).filter(
    x => x && x.track && idOf(x.track)
  );

  const radarSet = new Set();

  const radar = initialRadar.filter(x => {
    const id = idOf(x.track);

    if (radarSet.has(id)) return false;

    radarSet.add(id);
    return true;
  }).slice(0, 10).map(x => ({
    track: normalizeTrack(x.track),
    visible: x.visible !== false
  }));

  const state = {
    view: "home",
    results: [],
    favorites: normalizeStoredTracks(KEYS.favorites),
    queue: normalizeStoredTracks(KEYS.queue),
    current: null,
    seed: null,
    radar,
    chart: null,
    miniChart: null,
    requestId: 0,
    resultMode: "popular",
    activeMood: null,
    searchQuery: "",
    autoOpen: false
  };

  let toastTimer;

  // =========================
  // ARTWORK CACHE
  // =========================

  const artworkCache = new Map();
  const artworkPending = new Map();
  const failedCoverIds = new Set();
  const queuedCoverIds = new Set();
  const coverQueue = [];

  let activeCoverRequests = 0;

  // =========================
  // SPOTIFY PLAYER
  // =========================

  let spotifyAPI = window.__embeatSpotifyAPI || null;
  let spotifyController = null;
  let spotifyCreating = false;
  let spotifyReady = false;
  let spotifyPlaying = false;
  let spotifyPending = false;
  let spotifyLoadedUri = "";
  let spotifyWantedUri = "";
  let spotifyRequestId = 0;
  let spotifyStartTimer = null;
  let spotifyPendingTimer = null;

  document.addEventListener("embeat:spotify-ready", () => {
    spotifyAPI = window.__embeatSpotifyAPI;

    if (state.current) {
      loadSpotifyTrack(state.current);
    }
  });

  function spotifyTrackId(track) {
    const id = idOf(track);

    if (/^[A-Za-z0-9]{22}$/.test(id)) {
      return id;
    }

    for (const candidate of [
      track?.spotify_embed_url,
      track?.spotify_url
    ]) {
      if (typeof candidate !== "string") continue;

      const match = candidate.match(
        /^https:\/\/open\.spotify\.com\/(?:embed\/)?track\/([A-Za-z0-9]{22})(?:[/?#]|$)/
      );

      if (match) return match[1];
    }

    return "";
  }

  function spotifyTrackUri(track) {
    const id = spotifyTrackId(track);
    return id ? `spotify:track:${id}` : "";
  }

  function refreshPlayButtons() {
    document.querySelectorAll(
      '[data-track-action="play"]'
    ).forEach(button => {
      const tracks =
        button.dataset.scope === "favorites"
          ? state.favorites
          : state.results;

      const track = tracks[Number(button.dataset.index)];

      const active =
        track &&
        state.current &&
        idOf(track) === idOf(state.current) &&
        (spotifyPlaying || spotifyPending);

      button.textContent = active ? "⏸" : "▶";
      button.title = active ? "Tạm dừng" : "Phát nhạc";
      button.setAttribute("aria-label", button.title);
    });

    document.querySelectorAll(
      '[data-queue-action="play"]'
    ).forEach(button => {
      const track = state.queue[
        Number(button.dataset.index)
      ];

      const active =
        track &&
        state.current &&
        idOf(track) === idOf(state.current) &&
        (spotifyPlaying || spotifyPending);

      button.textContent = active ? "⏸" : "▶";
      button.title = active ? "Tạm dừng" : "Phát nhạc";
    });

    const button = $("playerPlayPauseBtn");

    if (button) {
      const active = spotifyPlaying || spotifyPending;

      button.textContent = active ? "⏸" : "▶";
      button.title = active ? "Tạm dừng" : "Phát nhạc";

      button.disabled =
        !state.current ||
        !spotifyTrackUri(state.current);
    }
  }

  function updateActiveTrackCards() {
    document.querySelectorAll(".track-card").forEach(card => {
      const button = card.querySelector(
        '[data-track-action="play"]'
      );

      if (!button) return;

      const tracks =
        button.dataset.scope === "favorites"
          ? state.favorites
          : state.results;

      const track = tracks[
        Number(button.dataset.index)
      ];

      const selected =
        !!track &&
        !!state.current &&
        idOf(track) === idOf(state.current);

      card.classList.toggle("playing", selected);
    });

    refreshPlayButtons();
  }

  function cancelSpotifyTimers() {
    clearTimeout(spotifyStartTimer);
    clearTimeout(spotifyPendingTimer);
  }

  function startPendingTimeout(requestId) {
    clearTimeout(spotifyPendingTimer);

    spotifyPendingTimer = setTimeout(() => {
      if (
        requestId !== spotifyRequestId ||
        spotifyPlaying
      ) {
        return;
      }

      spotifyPending = false;
      refreshPlayButtons();

      $("playerHelp").textContent =
        "Nếu nhạc chưa phát, nhấn Play trong khung Spotify.";
    }, 2500);
  }

  function requestSpotifyPlay(requestId) {
    clearTimeout(spotifyStartTimer);

    spotifyStartTimer = setTimeout(() => {
      if (
        requestId !== spotifyRequestId ||
        !spotifyController ||
        !spotifyReady
      ) {
        return;
      }

      if (
        spotifyLoadedUri !== spotifyWantedUri ||
        !state.current
      ) {
        return;
      }

      spotifyController.play();
    }, 100);

    startPendingTimeout(requestId);
  }

  function createSpotifyController(uri) {
    if (
      !spotifyAPI ||
      spotifyController ||
      spotifyCreating
    ) {
      return;
    }

    spotifyCreating = true;
    spotifyLoadedUri = uri;

    try {
      spotifyAPI.createController(
        $("spotifyFrame"),
        {
          width: "100%",
          height: 152,
          uri
        },
        controller => {
          spotifyController = controller;
          spotifyCreating = false;

          controller.addListener("ready", () => {
            spotifyReady = true;

            if (!spotifyWantedUri) return;

            if (spotifyLoadedUri !== spotifyWantedUri) {
              spotifyLoadedUri = spotifyWantedUri;
              controller.loadEntity(spotifyWantedUri);
            }

            requestSpotifyPlay(spotifyRequestId);
          });

          controller.addListener(
            "playback_update",
            event => {
              const data = event?.data || {};

              if (!spotifyWantedUri) return;

              if (
                data.playingURI &&
                data.playingURI !== spotifyWantedUri
              ) {
                return;
              }

              if (
                data.isPaused === false &&
                !data.isBuffering
              ) {
                spotifyPlaying = true;
                spotifyPending = false;
                clearTimeout(spotifyPendingTimer);
              } else if (
                data.isPaused === true &&
                !spotifyPending
              ) {
                spotifyPlaying = false;
              }

              refreshPlayButtons();
            }
          );

          controller.addListener(
            "playback_started",
            event => {
              if (!spotifyWantedUri) return;

              if (
                event?.data?.playingURI &&
                event.data.playingURI !== spotifyWantedUri
              ) {
                return;
              }

              spotifyPlaying = true;
              spotifyPending = false;
              clearTimeout(spotifyPendingTimer);
              refreshPlayButtons();
            }
          );
        }
      );
    } catch (error) {
      spotifyCreating = false;
      spotifyPending = false;

      $("playerHelp").textContent =
        "Không khởi tạo được Spotify Player.";

      console.error("Spotify IFrame API:", error);
      refreshPlayButtons();
    }
  }

  function loadSpotifyTrack(track) {
    const uri = spotifyTrackUri(track);
    const requestId = ++spotifyRequestId;

    cancelSpotifyTimers();

    spotifyWantedUri = uri;
    spotifyPlaying = false;
    spotifyPending = !!uri;

    refreshPlayButtons();

    if (!uri) {
      $("spotifyContainer").classList.add("hidden");

      $("playerHelp").textContent =
        "Bài hát không có Spotify ID hợp lệ.";

      if (spotifyController && spotifyReady) {
        spotifyController.pause();
      }

      return;
    }

    $("spotifyContainer").classList.remove("hidden");

    $("playerHelp").textContent = spotifyAPI
      ? "Đang tải nhạc qua Spotify..."
      : "Đang tải Spotify Player...";

    if (!spotifyAPI) return;

    if (!spotifyController) {
      createSpotifyController(uri);
      startPendingTimeout(requestId);
      return;
    }

    if (!spotifyReady) {
      startPendingTimeout(requestId);
      return;
    }

    if (spotifyLoadedUri !== uri) {
      spotifyLoadedUri = uri;
      spotifyController.loadEntity(uri);
    }

    requestSpotifyPlay(requestId);
  }

  function stopSpotify() {
    ++spotifyRequestId;
    cancelSpotifyTimers();

    spotifyWantedUri = "";
    spotifyPlaying = false;
    spotifyPending = false;

    if (spotifyController && spotifyReady) {
      spotifyController.pause();
    }

    $("spotifyContainer").classList.add("hidden");
    refreshPlayButtons();
  }

  function toggleSpotifyPlayback() {
    if (!state.current) return;

    if (!spotifyController || !spotifyReady) {
      toast(
        "Spotify Player đang tải. Hãy thử lại.",
        true
      );
      return;
    }

    if (spotifyPlaying || spotifyPending) {
      ++spotifyRequestId;
      cancelSpotifyTimers();

      spotifyPending = false;
      spotifyPlaying = false;

      spotifyController.pause();
    } else {
      spotifyPending = true;

      const requestId = ++spotifyRequestId;

      spotifyController.resume();
      startPendingTimeout(requestId);
    }

    refreshPlayButtons();
  }

  // =========================
  // HELPERS
  // =========================

  function toast(message, error = false) {
    const node = $("toast");

    clearTimeout(toastTimer);

    node.textContent = String(message);
    node.className =
      "toast show" + (error ? " error" : "");

    toastTimer = setTimeout(() => {
      node.classList.remove("show");
    }, 3600);
  }

  function coverNumber(t) {
    let hash = 0;

    for (const c of idOf(t)) {
      hash = (hash + c.charCodeAt(0)) % 1000;
    }

    return hash % 5;
  }

  function validHttpImage(input) {
    if (typeof input !== "string") return "";

    try {
      const url = new URL(input);

      return ["https:", "http:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function imageOf(track) {
    return validHttpImage(
      track?.album_image_url ||
      track?.image_url ||
      artworkCache.get(idOf(track)) ||
      ""
    );
  }

  function coverHTML(track, queue = false) {
    const url = imageOf(track);
    const css = queue ? "queue-cover" : "track-cover";

    return `
      <div
        class="${css} cover-${coverNumber(track)}"
        data-cover-id="${safe(idOf(track))}">
        ${
          url
            ? `<img
                 src="${safe(url)}"
                 alt=""
                 loading="lazy"
                 decoding="async"
                 onerror="this.remove();this.parentElement.textContent='♫'">`
            : "♫"
        }
      </div>`;
  }

  async function lookupCover(track) {
    const id = spotifyTrackId(track);

    if (!id || imageOf(track)) {
      return imageOf(track);
    }

    if (artworkPending.has(id)) {
      return artworkPending.get(id);
    }

    const request = (async () => {
      try {
        const controller = new AbortController();

        const timeout = setTimeout(
          () => controller.abort(),
          4500
        );

        let response;

        try {
          response = await fetch(
            "https://open.spotify.com/oembed?url=" +
              encodeURIComponent(
                "https://open.spotify.com/track/" + id
              ),
            {
              signal: controller.signal
            }
          );
        } finally {
          clearTimeout(timeout);
        }

        if (!response.ok) return "";

        const data = await response.json();
        const image = validHttpImage(data?.thumbnail_url);

        if (image) {
          artworkCache.set(idOf(track), image);
        }

        return image;
      } catch {
        return "";
      }
    })();

    artworkPending.set(id, request);

    try {
      return await request;
    } finally {
      artworkPending.delete(id);
    }
  }

  // =========================
  // PRELOAD COVER IMAGES
  // =========================

  function applyCover(trackId, url) {
    const imageUrl = validHttpImage(url);

    if (!imageUrl) return;

    document.querySelectorAll(
      "[data-cover-id]"
    ).forEach(box => {
      if (box.dataset.coverId !== trackId) {
        return;
      }

      const existing = box.querySelector("img");

      if (existing?.src === imageUrl) {
        return;
      }

      const image = document.createElement("img");

      image.src = imageUrl;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";

      image.onerror = () => {
        box.textContent = "♫";
      };

      box.replaceChildren(image);
    });

    if (
      state.current &&
      idOf(state.current) === trackId
    ) {
      const cover = $("playerCover");
      const existing = cover.querySelector("img");

      if (existing?.src !== imageUrl) {
        const image = document.createElement("img");

        image.src = imageUrl;
        image.alt =
          "Ảnh bìa " + nameOf(state.current);

        image.onerror = () => {
          cover.innerHTML =
            "<div>♫</div><span>EMBEAT MUSIC</span>";
        };

        cover.replaceChildren(image);
      }
    }
  }

  function pumpCoverQueue() {
    while (
      activeCoverRequests < 3 &&
      coverQueue.length
    ) {
      const track = coverQueue.shift();
      const id = idOf(track);

      activeCoverRequests++;

      lookupCover(track)
        .then(url => {
          if (url) {
            applyCover(id, url);
          } else {
            failedCoverIds.add(id);
          }
        })
        .catch(() => {
          failedCoverIds.add(id);
        })
        .finally(() => {
          activeCoverRequests--;
          queuedCoverIds.delete(id);
          pumpCoverQueue();
        });
    }
  }

  function preloadCovers(tracks) {
    for (const track of tracks) {
      const id = idOf(track);

      if (!id) continue;

      const image = imageOf(track);

      if (image) {
        applyCover(id, image);
        continue;
      }

      if (!spotifyTrackId(track)) continue;

      if (
        queuedCoverIds.has(id) ||
        failedCoverIds.has(id)
      ) {
        continue;
      }

      queuedCoverIds.add(id);
      coverQueue.push(track);
    }

    pumpCoverQueue();
  }

  // =========================
  // AUDIO FEATURES
  // =========================

  function featureRaw(track, key) {
    const raw =
      track?.audio_features?.[key] ??
      track?.[key];

    if (
      raw === null ||
      raw === undefined ||
      raw === ""
    ) {
      return null;
    }

    const value = Number(raw);

    return Number.isFinite(value)
      ? value
      : null;
  }

  function featureScaled(track, key) {
    const value = featureRaw(track, key);

    if (value === null) return null;

    const result =
      key === "tempo"
        ? value / 250
        : key === "loudness"
          ? (value + 60) / 60
          : value;

    return Math.min(
      1,
      Math.max(0, result)
    );
  }

  function featureText(track, key) {
    const value = featureRaw(track, key);

    if (value === null) return "—";

    if (key === "tempo") {
      return `${Math.round(value)} BPM`;
    }

    if (key === "loudness") {
      return `${value.toFixed(1)} dB`;
    }

    return value.toFixed(2);
  }

  function radarIndex(track) {
    return state.radar.findIndex(
      item =>
        idOf(item.track) === idOf(track)
    );
  }

  function isFavorite(track) {
    return state.favorites.some(
      item => idOf(item) === idOf(track)
    );
  }

  // =========================
  // API
  // =========================

  async function api(path, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      20000
    );

    try {
      const response = await fetch(
        API_BASE + path,
        {
          ...options,
          signal: controller.signal,
          headers: options.body
            ? {
                "Content-Type": "application/json",
                ...(options.headers || {})
              }
            : (options.headers || {})
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        let detail =
          data?.detail ||
          data?.message ||
          `HTTP ${response.status}`;

        if (Array.isArray(detail)) {
          detail = detail
            .map(item =>
              item.msg || JSON.stringify(item)
            )
            .join("; ");
        }

        throw new Error(String(detail));
      }

      if (data === null) {
        throw new Error(
          "API không trả về JSON hợp lệ."
        );
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          "Yêu cầu đã quá thời gian phản hồi."
        );
      }

      if (error instanceof TypeError) {
        throw new Error(
          "Không thể kết nối API tại " + API_BASE
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function checkHealth() {
    try {
      const data = await api("/api/v1/health");

      $("connectionDot").className =
        "connection-dot online";

      $("connectionText").textContent =
        "Music Engine Online";

      const total = Number(data.total_tracks);

      if (Number.isFinite(total)) {
        $("trackStat").textContent =
          total.toLocaleString("vi-VN");

        $("catalogCount").textContent =
          total.toLocaleString("vi-VN") +
          " bài hát";
      }
    } catch {
      $("connectionDot").className =
        "connection-dot offline";

      $("connectionText").textContent =
        "Chưa kết nối";

      $("catalogCount").textContent =
        "Kiểm tra Backend";
    }
  }

  // =========================
  // NAVIGATION
  // =========================

  function setView(view, scrollTop = true) {
    if (
      !["home", "favorites", "analysis"].includes(view)
    ) {
      return;
    }

    state.view = view;

    document.querySelectorAll(".view").forEach(element => {
      element.classList.toggle(
        "hidden",
        element.id !== view
      );
    });

    document.querySelectorAll("[data-view]").forEach(element => {
      element.classList.toggle(
        "active",
        element.dataset.view === view
      );
    });

    $("pageHeading").textContent = {
      home: "Khám phá âm nhạc",
      favorites: "Thư viện yêu thích",
      analysis: "Phân tích Radar"
    }[view];

    if (view === "favorites") {
      renderFavorites();
    }

    if (view === "analysis") {
      updateRadar();

      requestAnimationFrame(() => {
        state.chart?.resize();
      });
    }

    if (view === "home") {
      requestAnimationFrame(() => {
        state.miniChart?.resize();
      });
    }

    if (scrollTop) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }

  function scrollToResults() {
    requestAnimationFrame(() => {
      $("resultsSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  function setMood(mood) {
    state.activeMood = mood;

    document.querySelectorAll("[data-mood]").forEach(element => {
      element.classList.toggle(
        "active",
        element.dataset.mood === mood
      );
    });
  }

  // =========================
  // TRACK CARDS
  // =========================

  function trackFeaturesHTML(track) {
    const chips = HIGHLIGHTS
      .filter(([key]) =>
        featureRaw(track, key) !== null
      )
      .map(([key, label]) => {
        const normalized =
          featureScaled(track, key);

        const tempo = key === "tempo";

        return `
          <div
            class="feature-pill ${tempo ? "tempo" : ""}"
            title="${safe(label)}: ${safe(featureText(track, key))}">
            <span class="feature-label">
              ${safe(label)}
            </span>
            ${
              !tempo
                ? `<span class="feature-bar">
                     <i style="width:${Math.round(normalized * 100)}%"></i>
                   </span>`
                : ""
            }
            <strong>
              ${safe(featureText(track, key))}
            </strong>
          </div>`;
      });

    return chips.length
      ? chips.join("")
      : `<span class="feature-missing">
           Chưa có thông tin đặc trưng âm học
         </span>`;
  }

  function trackHTML(track, index, scope) {
    const selected =
      radarIndex(track) >= 0;

    const like =
      isFavorite(track);

    const playing =
      idOf(track) === idOf(state.current);

    const score =
      track?.similarity_score == null
        ? null
        : Number(track.similarity_score);

    const mmr =
      track?.mmr_score == null
        ? null
        : Number(track.mmr_score);

    let extras = "";

    if (Number.isFinite(score)) {
      extras +=
        ` · <span>Tương đồng ${(score * 100).toFixed(1)}%</span>`;
    }

    if (Number.isFinite(mmr)) {
      extras +=
        ` · MMR ${mmr.toFixed(3)}`;
    }

    if (
      !extras &&
      track?.popularity != null
    ) {
      extras =
        ` · Popularity ${safe(track.popularity)}`;
    }

    const active =
      playing &&
      (spotifyPlaying || spotifyPending);

    return `
      <article class="track-card ${playing ? "playing" : ""}">
        <div class="track-card-head">
          <span class="track-rank">
            ${String(index + 1).padStart(2, "0")}
          </span>

          ${coverHTML(track)}

          <div class="track-title">
            <h3 title="${safe(nameOf(track))}">
              ${safe(nameOf(track))}
            </h3>

            <p title="${safe(artistOf(track))}">
              ${safe(artistOf(track))}${extras}
            </p>
          </div>

          <div class="track-actions">
            <button
              class="track-icon-btn play"
              data-track-action="play"
              data-scope="${scope}"
              data-index="${index}"
              title="${active ? "Tạm dừng" : "Phát nhạc"}">
              ${active ? "⏸" : "▶"}
            </button>

            <button
              class="track-icon-btn ${like ? "liked" : ""}"
              data-track-action="favorite"
              data-scope="${scope}"
              data-index="${index}"
              title="Yêu thích">
              ${like ? "♥" : "♡"}
            </button>

            <button
              class="track-icon-btn"
              data-track-action="recommend"
              data-scope="${scope}"
              data-index="${index}"
              title="Gợi ý tương tự">
              ✧ Gợi ý
            </button>

            <button
              class="track-icon-btn"
              data-track-action="enqueue"
              data-scope="${scope}"
              data-index="${index}"
              title="Thêm vào hàng đợi">
              ＋
            </button>

            <label
              class="radar-check"
              title="Chọn hoặc bỏ chọn bài trên radar">
              <input
                type="checkbox"
                data-radar-pick="true"
                data-scope="${scope}"
                data-index="${index}"
                ${selected ? "checked" : ""}>
              ◎ Radar
            </label>
          </div>
        </div>

        <div class="track-features">
          ${trackFeaturesHTML(track)}
        </div>
      </article>`;
  }

  function showLoading() {
    $("resultCount").textContent =
      "Đang tải";

    $("resultsList").innerHTML =
      "<div class='skeleton'></div>".repeat(5);
  }

  function showError(message) {
    $("resultCount").textContent = "Lỗi";

    $("resultsList").innerHTML = `
      <div class="empty-state">
        <strong>Không thể tải danh sách</strong>
        ${safe(message)}

        <div class="mt-4">
          <button
            id="retryRequestBtn"
            class="btn-outline">
            Thử lại ↻
          </button>
        </div>
      </div>`;
  }

  function renderResults() {
    $("resultCount").textContent =
      `${state.results.length} bài hát`;

    if (!state.results.length) {
      const spotify =
        "https://open.spotify.com/search/" +
        encodeURIComponent(state.searchQuery);

      $("resultsList").innerHTML =
        state.resultMode === "search" &&
        state.searchQuery
          ? `
            <div class="empty-state">
              <strong>Không có kết quả trong EmBeat</strong>
              Hãy thử từ khóa khác.

              <div class="mt-3">
                <a
                  href="${safe(spotify)}"
                  target="_blank"
                  rel="noopener noreferrer">
                  Tìm trên Spotify ↗
                </a>
              </div>
            </div>`
          : `
            <div class="empty-state">
              <strong>Chưa có bài hát</strong>
              Hãy chọn một yêu cầu khác để khám phá.
            </div>`;
    } else {
      $("resultsList").innerHTML = state.results
        .map((track, index) =>
          trackHTML(track, index, "results")
        )
        .join("");
    }

    $("radarSelectedCount").textContent =
      `${state.radar.length}/10 đã chọn`;

    refreshPlayButtons();
    preloadCovers(state.results);
  }

  function updateSeed() {
    $("seedBanner").classList.toggle(
      "hidden",
      !state.seed
    );

    if (state.seed) {
      $("seedName").textContent =
        nameOf(state.seed) +
        " — " +
        artistOf(state.seed);
    }
  }

  function extractTracks(data, mode) {
    const items = Array.isArray(data)
      ? data
      : mode === "search"
        ? (data?.results ?? data?.tracks)
        : (
            data?.recommendations ??
            data?.results ??
            data?.tracks
          );

    if (!Array.isArray(items)) {
      throw new Error(
        "Dữ liệu bài hát từ API không hợp lệ."
      );
    }

    return unique(items);
  }

  // =========================
  // LOAD RESULTS
  // =========================

  async function loadResults(
    title,
    description,
    producer,
    mode,
    scroll = true
  ) {
    const requestId = ++state.requestId;

    state.resultMode = mode;

    setView("home", false);

    $("resultsTitle").textContent =
      title;

    $("resultsDescription").textContent =
      description;

    updateSeed();
    showLoading();

    if (scroll) {
      scrollToResults();
    }

    try {
      const data = await producer();

      if (requestId !== state.requestId) {
        return null;
      }

      state.results =
        extractTracks(data, mode);

      if (
        mode === "track" &&
        data?.seed_track
      ) {
        state.seed =
          normalizeTrack(data.seed_track);

        updateSeed();
      }

      renderResults();

      if (scroll) {
        scrollToResults();
      }

      return data;
    } catch (error) {
      if (requestId !== state.requestId) {
        return null;
      }

      state.results = [];

      showError(error.message);
      toast(error.message, true);

      if (scroll) {
        scrollToResults();
      }

      return null;
    }
  }

  function loadPopular(scroll = true) {
    state.seed = null;
    state.searchQuery = "";

    setMood(null);

    return loadResults(
      "Phổ biến trong EmBeat",
      "Những bài hát nổi bật trong thư viện âm nhạc.",
      () => api("/api/v1/recommend/popular?k=10"),
      "popular",
      scroll
    );
  }

  function searchTracks() {
    const query =
      $("searchInput").value.trim();

    if (!query) {
      $("searchInput").focus();

      toast(
        "Vui lòng nhập tên bài hát hoặc ca sĩ.",
        true
      );

      return;
    }

    state.searchQuery = query;
    state.seed = null;

    setMood(null);

    return loadResults(
      `Kết quả cho “${query}”`,
      "Tìm kiếm trong danh mục bài hát của EmBeat.",
      () => api(
        `/api/v1/search?q=${encodeURIComponent(query)}&limit=20`
      ),
      "search",
      true
    );
  }

  function recommendMood(mood) {
    if (!MOODS[mood]) return;

    state.seed = null;
    state.searchQuery = "";

    setMood(mood);

    return loadResults(
      `Giai điệu ${MOODS[mood]}`,
      "Danh sách phù hợp với tâm trạng của bạn.",
      () => api(
        `/api/v1/recommend/mood/${mood}?k=10`
      ),
      "mood",
      true
    );
  }

  function recommendTrack(track) {
    if (!idOf(track)) return;

    state.seed = track;
    state.searchQuery = "";

    setMood(null);

    const params = new URLSearchParams({
      k: $("recommendCount").value,
      strategy: $("strategySelect").value,
      alpha: $("alphaInput").value,
      mmr_lambda: $("lambdaInput").value,
      exclude_same_artist: String(
        $("excludeArtist").checked
      )
    });

    return loadResults(
      `Gợi ý tương tự “${nameOf(track)}”`,
      "Khám phá các bản nhạc dựa trên đặc trưng âm học và thể loại.",
      () => api(
        `/api/v1/recommend/track/${encodeURIComponent(idOf(track))}?${params}`
      ),
      "track",
      true
    );
  }

  function recommendProfile() {
    const ids = [
      ...new Set(
        state.favorites
          .map(idOf)
          .filter(Boolean)
      )
    ].slice(0, 50);

    if (ids.length < 2) {
      setView("favorites");

      toast(
        "Hãy lưu ít nhất 2 bài hát yêu thích.",
        true
      );

      return;
    }

    state.seed = null;
    state.searchQuery = "";

    setMood(null);

    return loadResults(
      "Gợi ý theo gu âm nhạc của bạn",
      `Đề xuất dựa trên ${ids.length} bài hát yêu thích.`,
      () => api(
        "/api/v1/recommend/profile",
        {
          method: "POST",
          body: JSON.stringify({
            track_ids: ids,
            k: 10,
            alpha: 0.7,
            exclude_same_artist: false
          })
        }
      ),
      "profile",
      true
    );
  }

  function retry() {
    if (state.resultMode === "search") {
      return searchTracks();
    }

    if (
      state.resultMode === "track" &&
      state.seed
    ) {
      return recommendTrack(state.seed);
    }

    if (
      state.resultMode === "mood" &&
      state.activeMood
    ) {
      return recommendMood(state.activeMood);
    }

    if (state.resultMode === "profile") {
      return recommendProfile();
    }

    return loadPopular(true);
  }

  // =========================
  // FAVORITES
  // =========================

  function refreshFavoriteCount() {
    $("favCount").textContent =
      state.favorites.length;

    $("favoriteStat").textContent =
      state.favorites.length;

    $("favoriteCountLabel").textContent =
      state.favorites.length + " bài hát";
  }

  function renderFavorites() {
    refreshFavoriteCount();

    $("favoritesList").innerHTML =
      state.favorites.length
        ? state.favorites
            .map((track, index) =>
              trackHTML(track, index, "favorites")
            )
            .join("")
        : `
          <div class="empty-state">
            <strong>Thư viện của bạn đang trống</strong>
            Nhấn ♡ bên cạnh bài hát để lưu lại.

            <div class="mt-4">
              <button
                id="emptyFavoritesDiscover"
                class="btn-primary">
                Khám phá âm nhạc ↗
              </button>
            </div>
          </div>`;

    refreshPlayButtons();
    preloadCovers(state.favorites);
  }

  function toggleFavorite(track) {
    if (!idOf(track)) return;

    if (isFavorite(track)) {
      state.favorites =
        state.favorites.filter(
          item =>
            idOf(item) !== idOf(track)
        );

      toast("Đã xóa khỏi Yêu thích.");
    } else {
      state.favorites.unshift(track);
      toast("Đã lưu vào Yêu thích ♥");
    }

    store(KEYS.favorites, state.favorites);

    renderResults();
    renderFavorites();
    renderPlayer();
  }

  // =========================
  // SPOTIFY LINK
  // =========================

  function spotifyURL(track, embed = false) {
    const id = spotifyTrackId(track);

    return id
      ? `https://open.spotify.com/${embed ? "embed/" : ""}track/${id}`
      : "";
  }

  // =========================
  // QUEUE
  // =========================

  function persistQueue() {
    state.queue =
      unique(state.queue).slice(0, 100);

    store(KEYS.queue, state.queue);
    renderQueue();
  }

  function addQueue(track, quiet = false) {
    if (!idOf(track)) return;

    if (
      state.queue.some(
        item =>
          idOf(item) === idOf(track)
      )
    ) {
      if (!quiet) {
        toast("Bài hát đã có trong hàng đợi.");
      }

      return;
    }

    state.queue.push(track);
    persistQueue();

    if (!quiet) {
      toast("Đã thêm bài hát vào hàng đợi.");
    }
  }

  function addMultipleQueue(tracks) {
    if (!tracks.length) {
      toast(
        "Danh sách hiện chưa có bài hát.",
        true
      );
      return;
    }

    const seen = new Set(
      state.queue.map(idOf)
    );

    let count = 0;

    for (const track of tracks) {
      if (!seen.has(idOf(track))) {
        state.queue.push(track);
        seen.add(idOf(track));
        count++;
      }
    }

    persistQueue();

    if (
      !state.current &&
      state.queue.length
    ) {
      playTrack(state.queue[0]);
    }

    toast(
      `Đã thêm ${count} bài hát vào hàng đợi.`
    );
  }

  function playTrack(track) {
    if (!idOf(track)) return;

    const sameTrack =
      state.current &&
      idOf(track) === idOf(state.current);

    if (sameTrack) {
      toggleSpotifyPlayback();
      return;
    }

    addQueue(track, true);
    state.current = track;

    // Không vẽ lại toàn bộ danh sách khi chuyển bài.
    renderPlayer();
    loadSpotifyTrack(track);
    updateActiveTrackCards();
  }

  function playAdjacent(step) {
    if (!state.queue.length) {
      toast(
        "Hàng đợi đang trống.",
        true
      );
      return;
    }

    let index =
      state.queue.findIndex(
        track =>
          idOf(track) === idOf(state.current)
      );

    index = index === -1
      ? 0
      : (
          index +
          step +
          state.queue.length
        ) % state.queue.length;

    playTrack(state.queue[index]);
  }

  function renderQueue() {
    $("queueCount").textContent =
      state.queue.length + " bài hát";

    $("queueList").innerHTML =
      state.queue.length
        ? state.queue.map((track, index) => `
            <div class="queue-row ${
              idOf(track) === idOf(state.current)
                ? "active"
                : ""
            }">
              ${coverHTML(track, true)}

              <div class="queue-details">
                <strong>${safe(nameOf(track))}</strong>
                <small>${safe(artistOf(track))}</small>
              </div>

              <button
                class="queue-btn"
                data-queue-action="play"
                data-index="${index}"
                title="Nghe">
                ▶
              </button>

              <button
                class="queue-btn"
                data-queue-action="up"
                data-index="${index}"
                title="Đưa lên">
                ↑
              </button>

              <button
                class="queue-btn"
                data-queue-action="remove"
                data-index="${index}"
                title="Xóa">
                ✕
              </button>
            </div>
          `).join("")
        : `
          <p class="queue-empty">
            Chưa có bài hát trong hàng đợi.
          </p>`;
  }

  function handleQueue(action, index) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= state.queue.length
    ) {
      return;
    }

    if (action === "play") {
      playTrack(state.queue[index]);
      return;
    }

    if (action === "remove") {
      const removed =
        state.queue.splice(index, 1)[0];

      if (
        idOf(removed) === idOf(state.current)
      ) {
        state.current = null;
      }

      persistQueue();
      renderPlayer();
      renderResults();
      return;
    }

    if (
      action === "up" &&
      index > 0
    ) {
      [
        state.queue[index - 1],
        state.queue[index]
      ] = [
        state.queue[index],
        state.queue[index - 1]
      ];

      persistQueue();
    }
  }

  // =========================
  // PLAYER RENDER
  // =========================

  function renderPlayer() {
    const track = state.current;

    $("playerTitle").textContent =
      track
        ? nameOf(track)
        : "Chưa chọn bài hát";

    $("playerArtist").textContent =
      track
        ? artistOf(track)
        : "Bấm ▶ trên danh sách để nghe";

    $("playerFavoriteBtn").textContent =
      track && isFavorite(track)
        ? "♥ Đã yêu thích"
        : "♡ Yêu thích";

    const cover = $("playerCover");

    const image =
      track
        ? imageOf(track)
        : "";

    if (image) {
      const img =
        document.createElement("img");

      img.src = image;
      img.alt =
        "Ảnh bìa " + nameOf(track);

      img.onerror = () => {
        cover.innerHTML =
          "<div>♫</div><span>EMBEAT MUSIC</span>";
      };

      cover.replaceChildren(img);
    } else {
      cover.innerHTML =
        "<div>♫</div><span>EMBEAT MUSIC</span>";
    }

    const external =
      track
        ? spotifyURL(track)
        : "";

    $("spotifyLink").classList.toggle(
      "hidden",
      !external
    );

    if (external) {
      $("spotifyLink").href = external;
    }

    if (!track) {
      stopSpotify();

      $("playerHelp").textContent =
        "Chọn bài hát để nghe qua Spotify.";
    }

    renderQueue();
    refreshPlayButtons();

    if (track && !image) {
      const currentId = idOf(track);

      lookupCover(track).then(url => {
        if (
          url &&
          idOf(state.current) === currentId
        ) {
          applyCover(currentId, url);
        }
      });
    }
  }

  // =========================
  // RADAR
  // =========================

  function persistRadar() {
    store(KEYS.radar, state.radar);

    $("radarSelectedCount").textContent =
      `${state.radar.length}/10 đã chọn`;

    $("miniRadarCount").textContent =
      `${state.radar.length}/10 bài đã chọn`;

    renderResults();

    if (state.view === "favorites") {
      renderFavorites();
    }

    updateRadar();
  }

  function toggleRadar(track) {
    const index = radarIndex(track);

    if (index >= 0) {
      state.radar.splice(index, 1);
      persistRadar();

      toast(
        "Đã bỏ bài hát khỏi Radar."
      );
      return;
    }

    if (state.radar.length >= 10) {
      toast(
        "Radar chỉ hỗ trợ tối đa 10 bài. Hãy bỏ chọn một bài trước.",
        true
      );

      renderResults();

      if (state.view === "favorites") {
        renderFavorites();
      }

      return;
    }

    state.radar.push({
      track,
      visible: true
    });

    persistRadar();

    toast(
      `Đã chọn ${state.radar.length}/10 bài để phân tích.`
    );

    if (state.autoOpen) {
      setView("analysis");
    }
  }

  function radarDatasets(mini = false) {
    return state.radar.flatMap(
      (entry, index) => {
        if (!entry.visible) return [];

        const values = FEATURES.map(
          ([key]) =>
            featureScaled(entry.track, key)
        );

        if (
          values.every(value => value === null)
        ) {
          return [];
        }

        return [{
          label: nameOf(entry.track),
          data: values,
          borderColor: COLORS[index],
          backgroundColor:
            mini || state.radar.length > 3
              ? "transparent"
              : COLORS[index] + "1c",
          pointBackgroundColor: COLORS[index],
          pointBorderColor: COLORS[index],
          borderWidth: mini ? 1.5 : 2,
          pointRadius: mini ? 1.5 : 2.5,
          fill:
            !mini &&
            state.radar.length <= 3,
          spanGaps: false
        }];
      }
    );
  }

  function createRadar(canvas, datasets, mini = false) {
    return new Chart(
      canvas.getContext("2d"),
      {
        type: "radar",

        data: {
          labels: FEATURES.map(
            ([, label]) => label
          ),
          datasets
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          animation: {
            duration: 300
          },

          plugins: {
            legend: {
              display: false
            },

            tooltip: {
              callbacks: {
                label: context => {
                  return `${context.dataset.label}: ${
                    typeof context.raw === "number"
                      ? context.raw.toFixed(2)
                      : "—"
                  }`;
                }
              }
            }
          },

          scales: {
            r: {
              min: 0,
              max: 1,
              beginAtZero: true,

              ticks: {
                display: false,
                stepSize: 0.2
              },

              grid: {
                color: "#364255"
              },

              angleLines: {
                color: "#364255"
              },

              pointLabels: {
                color: "#acbacd",
                font: {
                  size: mini ? 8 : 10,
                  family: "Inter"
                }
              }
            }
          }
        }
      }
    );
  }

  function updateMiniRadar() {
    if (state.miniChart) {
      state.miniChart.destroy();
      state.miniChart = null;
    }

    const datasets =
      radarDatasets(true);

    $("miniRadarEmpty").classList.toggle(
      "hidden",
      datasets.length > 0 &&
      typeof Chart !== "undefined"
    );

    if (
      datasets.length &&
      typeof Chart !== "undefined"
    ) {
      state.miniChart = createRadar(
        $("miniRadarChart"),
        datasets,
        true
      );
    }
  }

  function renderRadarSelections() {
    $("analysisCount").textContent =
      `${state.radar.length}/10 bài đã chọn`;

    if (!state.radar.length) {
      $("radarSelectionList").innerHTML = `
        <div class="selection-placeholder">
          Chưa có bài nào được chọn.
          Trở lại Khám phá và tick ◎ Radar bên cạnh bài hát.
        </div>`;

      $("analysisFeatureList").innerHTML = `
        <div class="selection-placeholder">
          Các chỉ số âm học sẽ xuất hiện khi bạn chọn bài hát.
        </div>`;

      return;
    }

    $("radarSelectionList").innerHTML =
      state.radar
        .map((entry, index) => `
          <div class="radar-selection-row">
            <input
              type="checkbox"
              data-radar-visible="${index}"
              title="Hiện/ẩn bài trên Radar"
              ${entry.visible ? "checked" : ""}>

            <span
              class="radar-color"
              style="background:${COLORS[index]}">
            </span>

            <div class="radar-selection-title">
              <strong>
                ${safe(nameOf(entry.track))}
              </strong>

              <small>
                ${safe(artistOf(entry.track))}
              </small>
            </div>

            <button
              class="radar-remove"
              data-radar-remove="${index}"
              title="Xóa khỏi Radar">
              ✕
            </button>
          </div>
        `)
        .join("");

    $("analysisFeatureList").innerHTML =
      state.radar
        .map((entry, index) => `
          <div class="analysis-feature-row">
            <strong style="color:${COLORS[index]}">
              ${index + 1}. ${safe(nameOf(entry.track))}
            </strong>

            <p>${safe(artistOf(entry.track))}</p>

            <div class="analysis-feature-values">
              ${
                FEATURES.map(([key, label]) => `
                  <span title="${safe(label)}">
                    ${safe(label)}:
                    <b>
                      ${safe(featureText(entry.track, key))}
                    </b>
                  </span>
                `).join("")
              }
            </div>
          </div>
        `)
        .join("");
  }

  function updateRadar() {
    renderRadarSelections();

    if (state.chart) {
      state.chart.destroy();
      state.chart = null;
    }

    const datasets =
      radarDatasets();

    const enough =
      datasets.length >= 2 &&
      typeof Chart !== "undefined";

    $("radarEmpty").classList.toggle(
      "hidden",
      enough
    );

    if (!enough) {
      const hint =
        datasets.length === 1
          ? "Hãy bật thêm ít nhất 1 bài hát để so sánh."
          : "Tick ô ◎ trên các bài hát ở trang Khám phá hoặc Yêu thích để bắt đầu.";

      $("radarEmpty")
        .querySelector("p")
        .textContent =
          typeof Chart === "undefined"
            ? "Không tải được thư viện Chart.js."
            : hint;
    } else {
      state.chart = createRadar(
        $("radarChart"),
        datasets
      );
    }

    updateMiniRadar();
  }

  function changeRadarVisibility(index, visible) {
    if (!state.radar[index]) return;

    state.radar[index].visible =
      visible;

    store(KEYS.radar, state.radar);
    updateRadar();
  }

  function allRadarVisibility(visible) {
    state.radar.forEach(entry => {
      entry.visible = visible;
    });

    store(KEYS.radar, state.radar);
    updateRadar();
  }

  // =========================
  // SETTINGS
  // =========================

  function settingsUpdate() {
    $("alphaValue").textContent =
      Number($("alphaInput").value).toFixed(2);

    $("lambdaValue").textContent =
      Number($("lambdaInput").value).toFixed(2);

    $("alphaInput").disabled =
      $("strategySelect").value === "audio";

    $("lambdaInput").disabled =
      $("strategySelect").value !== "mmr";
  }

  // =========================
  // EVENTS
  // =========================

  $("brandHome").addEventListener("click", event => {
    event.preventDefault();
    setView("home");
  });

  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      setView(button.dataset.view);
    });
  });

  document.querySelectorAll("[data-mood]").forEach(button => {
    button.addEventListener("click", () => {
      recommendMood(button.dataset.mood);
    });
  });

  $("searchForm").addEventListener("submit", event => {
    event.preventDefault();
    searchTracks();
  });

  $("sideSearch").addEventListener("click", () => {
    setView("home");
    $("searchInput").focus();
  });

  $("sidePopular").addEventListener("click", () => {
    loadPopular(true);
  });

  $("profileBtn").addEventListener(
    "click",
    recommendProfile
  );

  $("favoritesProfileBtn").addEventListener(
    "click",
    recommendProfile
  );

  $("refreshBtn").addEventListener(
    "click",
    retry
  );

  $("queueAllBtn").addEventListener("click", () => {
    addMultipleQueue(state.results);
  });

  $("queueFavoritesBtn").addEventListener("click", () => {
    addMultipleQueue(state.favorites);
  });

  $("seedAnalyzeBtn").addEventListener("click", () => {
    if (
      state.seed &&
      radarIndex(state.seed) < 0
    ) {
      toggleRadar(state.seed);
    }

    setView("analysis");
  });

  $("openAnalysisBtn").addEventListener("click", () => {
    setView("analysis");
  });

  $("analysisToHomeBtn").addEventListener("click", () => {
    setView("home");
  });

  $("openRadarCheckbox").addEventListener(
    "change",
    event => {
      state.autoOpen =
        event.target.checked;

      if (state.autoOpen) {
        setView("analysis");
      }
    }
  );

  $("prevBtn").addEventListener("click", () => {
    playAdjacent(-1);
  });

  $("playerPlayPauseBtn").addEventListener(
    "click",
    toggleSpotifyPlayback
  );

  $("nextBtn").addEventListener("click", () => {
    playAdjacent(1);
  });

  $("playerFavoriteBtn").addEventListener(
    "click",
    () => {
      if (state.current) {
        toggleFavorite(state.current);
      } else {
        toast(
          "Hãy chọn bài hát trước.",
          true
        );
      }
    }
  );

  $("clearQueueBtn").addEventListener("click", () => {
    state.queue = [];
    state.current = null;

    persistQueue();
    renderPlayer();
    renderResults();

    toast("Đã xóa hàng đợi.");
  });

  $("showAllRadarBtn").addEventListener("click", () => {
    allRadarVisibility(true);
  });

  $("hideAllRadarBtn").addEventListener("click", () => {
    allRadarVisibility(false);
  });

  $("clearRadarBtn").addEventListener("click", () => {
    state.radar = [];
    persistRadar();

    toast(
      "Đã xóa danh sách so sánh."
    );
  });

  $("alphaInput").addEventListener(
    "input",
    settingsUpdate
  );

  $("lambdaInput").addEventListener(
    "input",
    settingsUpdate
  );

  $("strategySelect").addEventListener(
    "change",
    settingsUpdate
  );

  // =========================
  // RADAR CHECKBOXES
  // =========================

  document.addEventListener("change", event => {
    const pick = event.target.closest(
      "[data-radar-pick]"
    );

    if (pick) {
      const index =
        Number(pick.dataset.index);

      const tracks =
        pick.dataset.scope === "favorites"
          ? state.favorites
          : state.results;

      if (tracks[index]) {
        toggleRadar(tracks[index]);
      }

      return;
    }

    const visible = event.target.closest(
      "[data-radar-visible]"
    );

    if (visible) {
      changeRadarVisibility(
        Number(visible.dataset.radarVisible),
        visible.checked
      );
    }
  });

  // =========================
  // DYNAMIC BUTTONS
  // =========================

  document.addEventListener("click", event => {
    const trackButton = event.target.closest(
      "[data-track-action]"
    );

    if (trackButton) {
      const tracks =
        trackButton.dataset.scope === "favorites"
          ? state.favorites
          : state.results;

      const track = tracks[
        Number(trackButton.dataset.index)
      ];

      if (!track) return;

      switch (trackButton.dataset.trackAction) {
        case "play":
          playTrack(track);
          break;

        case "favorite":
          toggleFavorite(track);
          break;

        case "recommend":
          recommendTrack(track);
          break;

        case "enqueue":
          addQueue(track);
          break;
      }

      return;
    }

    const queueButton = event.target.closest(
      "[data-queue-action]"
    );

    if (queueButton) {
      handleQueue(
        queueButton.dataset.queueAction,
        Number(queueButton.dataset.index)
      );

      return;
    }

    const remove = event.target.closest(
      "[data-radar-remove]"
    );

    if (remove) {
      const index =
        Number(remove.dataset.radarRemove);

      if (state.radar[index]) {
        state.radar.splice(index, 1);
        persistRadar();
      }

      return;
    }

    if (event.target.closest("#retryRequestBtn")) {
      retry();
    }

    if (event.target.closest("#emptyFavoritesDiscover")) {
      loadPopular(true);
    }
  });

  // =========================
  // INITIALIZATION
  // =========================

  function init() {
    refreshFavoriteCount();
    settingsUpdate();

    renderFavorites();
    renderQueue();
    renderPlayer();

    updateSeed();
    updateRadar();

    checkHealth();
    loadPopular(false);

    window.scrollTo(0, 0);
  }

  init();
});
