document.addEventListener('DOMContentLoaded', () => {
    console.log('Khởi tạo Frontend - Music Recommender System (Pure API Mode)');

    // Quản lý trạng thái danh sách yêu thích
    let favorites = JSON.parse(localStorage.getItem('embeat_favorites')) || [];

    // 1. Khởi tạo Radar Chart hiển thị Audio Features
    const canvasElement = document.getElementById('audioFeaturesChart');
    let audioChart = null;

    if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        audioChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Độ nhảy múa', 'Năng lượng', 'Cảm xúc', 'Độ mộc', 'Độ sống động', 'Lời bài hát'],
                datasets: [{
                    label: 'Đặc trưng bài hát',
                    data: [0.85, 0.78, 0.65, 0.20, 0.12, 0.08],
                    backgroundColor: 'rgba(29, 185, 84, 0.25)',
                    borderColor: '#1DB954',
                    pointBackgroundColor: '#1DB954',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#1DB954',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
                        grid: { color: 'rgba(255, 255, 255, 0.15)' },
                        pointLabels: {
                            color: '#d4d4d8',
                            font: { size: 11, family: 'sans-serif', weight: '500' }
                        },
                        ticks: { display: false, backdropColor: 'transparent' },
                        suggestedMin: 0,
                        suggestedMax: 1
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 2. Điều hướng Sidebar Tabs
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = {
        'home': document.getElementById('homeView'),
        'favorites': document.getElementById('favoritesView'),
        'analysis': document.getElementById('analysisView')
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetKey = item.getAttribute('data-target');

            navItems.forEach(nav => {
                nav.classList.remove('text-emerald-400', 'font-semibold', 'bg-zinc-900/80');
                nav.classList.add('text-zinc-400');
            });
            item.classList.remove('text-zinc-400');
            item.classList.add('text-emerald-400', 'font-semibold', 'bg-zinc-900/80');

            Object.keys(viewSections).forEach(key => {
                if (viewSections[key]) {
                    if (key === targetKey) {
                        viewSections[key].classList.remove('hidden');
                    } else {
                        viewSections[key].classList.add('hidden');
                    }
                }
            });

            if (targetKey === 'favorites') {
                renderFavorites();
            }
        });
    });

    // 3. Gọi API thật từ Backend FastAPI
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const recommendationsList = document.getElementById('recommendationsList');
    const spotifyPlayer = document.getElementById('spotifyPlayer');
    const nowPlayingTitle = document.getElementById('nowPlayingTitle');
    const resultCount = document.getElementById('resultCount');

    async function fetchRecommendations(query) {
        try {
            if (recommendationsList) {
                recommendationsList.innerHTML = `<div class="text-zinc-400 text-center py-8">Đang gọi API từ Backend xử lý mô hình gợi ý...</div>`;
            }
            
            const API_URL = `http://127.0.0.1:5000/api/v1/search?q=${encodeURIComponent(query)}`;
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`Lỗi kết nối Server Backend (Status: ${response.status})`);
            }

            const data = await response.json();
            renderSongs(data.results);
        } catch (error) {
            console.error('Không thể lấy dữ liệu từ Backend:', error);
            if (recommendationsList) {
                recommendationsList.innerHTML = `
                    <div class="text-red-400 text-center py-8 bg-red-950/20 rounded-2xl border border-red-500/20 space-y-2">
                        <p class="font-bold">Không thể kết nối tới Backend!</p>
                        <p class="text-xs text-zinc-400">Hãy đảm bảo server Python/FastAPI đang chạy ở cổng 5000.</p>
                    </div>
                `;
            }
            if (resultCount) resultCount.textContent = `Lỗi kết nối`;
        }
    }

    // Hàm render danh sách bài hát nhận được từ API
    function renderSongs(songs) {
        if (!recommendationsList) return;
        recommendationsList.innerHTML = '';
        
        if (!songs || songs.length === 0) {
            recommendationsList.innerHTML = `<div class="text-zinc-500 text-center py-8">Không tìm thấy bài hát phù hợp từ cơ sở dữ liệu Spotify.</div>`;
            if (resultCount) resultCount.textContent = `0 kết quả`;
            return;
        }

        if (resultCount) resultCount.textContent = `${songs.length} bài hát gợi ý`;

        songs.forEach((song, index) => {
            const trackId = song.track_id || '7MXVkk9YMctZqd1Srtv4MB';
            const isFav = favorites.some(fav => fav.track_id === trackId);

            const card = document.createElement('div');
            card.className = "flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-2xl transition border border-zinc-800/80 group";
            
            card.innerHTML = `
                <div class="flex items-center gap-4 cursor-pointer flex-1 song-info-trigger">
                    <div class="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">${index + 1}</div>
                    <div>
                        <h4 class="font-semibold text-white group-hover:text-emerald-400 transition">${song.track_name}</h4>
                        <p class="text-xs text-zinc-400">${song.artist_name} • ${song.album || 'Spotify Track'}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 font-medium">Match ${song.similarity_score ? Math.round(song.similarity_score * 100) : (song.match_score || '95')}%</span>
                    
                    <button class="fav-btn p-2.5 rounded-xl transition ${isFav ? 'text-red-500 bg-red-500/10 border border-red-500/30' : 'text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800'}" title="Thêm vào gu âm nhạc yêu thích">
                        <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-base"></i>
                    </button>

                    <button class="play-btn p-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition shadow-md shadow-emerald-500/20" title="Phát bài hát">
                        <i class="fa-solid fa-play text-sm"></i>
                    </button>
                </div>`;

            const triggerPlay = () => {
                if (spotifyPlayer) {
                    spotifyPlayer.src = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
                }
                if (nowPlayingTitle) {
                    nowPlayingTitle.textContent = `${song.track_name} - ${song.artist_name}`;
                }
                
                if (song.audio_features && audioChart) {
                    audioChart.data.datasets[0].data = [
                        song.audio_features.danceability ?? 0.8,
                        song.audio_features.energy ?? 0.7,
                        song.audio_features.valence ?? 0.6,
                        song.audio_features.acousticness ?? 0.2,
                        song.audio_features.liveness ?? 0.1,
                        song.audio_features.speechiness ?? 0.05
                    ];
                    audioChart.update();
                }
            };

            card.querySelector('.song-info-trigger').addEventListener('click', triggerPlay);
            card.querySelector('.play-btn').addEventListener('click', triggerPlay);

            const favBtn = card.querySelector('.fav-btn');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const existingIndex = favorites.findIndex(fav => fav.track_id === trackId);
                
                if (existingIndex > -1) {
                    favorites.splice(existingIndex, 1);
                    favBtn.className = "fav-btn p-2.5 rounded-xl transition text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800";
                    favBtn.querySelector('i').className = "fa-regular fa-heart text-base";
                } else {
                    favorites.push(song);
                    favBtn.className = "fav-btn p-2.5 rounded-xl transition text-red-500 bg-red-500/10 border border-red-500/30";
                    favBtn.querySelector('i').className = "fa-solid fa-heart text-base";
                }
                localStorage.setItem('embeat_favorites', JSON.stringify(favorites));
            });

            recommendationsList.appendChild(card);
        });
    }

    // 4. Xử lý bộ nút chọn Mood / Thể loại nhanh
    const moodButtons = document.querySelectorAll('.mood-btn, [data-mood]');
    moodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const moodQuery = btn.getAttribute('data-mood') || btn.textContent.trim();
            if (searchInput) {
                searchInput.value = moodQuery;
            }
            fetchRecommendations(moodQuery);
        });
    });

    // Render danh sách Gu âm nhạc (Yêu thích cá nhân)
    function renderFavorites() {
        const favoritesList = document.getElementById('favoritesList');
        if (!favoritesList) return;
        favoritesList.innerHTML = '';

        if (!favorites || favorites.length === 0) {
            favoritesList.innerHTML = `<div class="text-zinc-500 text-center py-12 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">Chưa có bài hát nào trong danh sách yêu thích. Hãy bấm vào biểu tượng trái tim ở các bài hát gợi ý nhé!</div>`;
            return;
        }

        favorites.forEach((song, index) => {
            const trackId = song.track_id || '7MXVkk9YMctZqd1Srtv4MB';
            const card = document.createElement('div');
            card.className = "flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-2xl transition border border-zinc-800/80";
            card.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 font-bold border border-red-500/20">${index + 1}</div>
                    <div>
                        <h4 class="font-semibold text-white">${song.track_name}</h4>
                        <p class="text-xs text-zinc-400">${song.artist_name} • ${song.album || 'Spotify Track'}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button class="remove-fav-btn px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-semibold transition border border-red-500/30 flex items-center gap-2">
                        <i class="fa-solid fa-trash-can"></i>
                        <span>Bỏ thích</span>
                    </button>
                    <button class="play-fav-btn px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition flex items-center gap-2">
                        <i class="fa-solid fa-play"></i>
                        <span>Phát</span>
                    </button>
                </div>
            `;

            card.querySelector('.play-fav-btn').addEventListener('click', () => {
                if (spotifyPlayer) spotifyPlayer.src = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
                if (nowPlayingTitle) nowPlayingTitle.textContent = `${song.track_name} - ${song.artist_name}`;
                
                if (song.audio_features && audioChart) {
                    audioChart.data.datasets[0].data = [
                        song.audio_features.danceability ?? 0.8,
                        song.audio_features.energy ?? 0.7,
                        song.audio_features.valence ?? 0.6,
                        song.audio_features.acousticness ?? 0.2,
                        song.audio_features.liveness ?? 0.1,
                        song.audio_features.speechiness ?? 0.05
                    ];
                    audioChart.update();
                }
            });

            card.querySelector('.remove-fav-btn').addEventListener('click', () => {
                favorites = favorites.filter(fav => fav.track_id !== song.track_id);
                localStorage.setItem('embeat_favorites', JSON.stringify(favorites));
                renderFavorites();
            });

            favoritesList.appendChild(card);
        });
    }

    const clearFavoritesBtn = document.getElementById('clearFavorites');
    if (clearFavoritesBtn) {
        clearFavoritesBtn.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách gu âm nhạc yêu thích không?')) {
                favorites = [];
                localStorage.removeItem('embeat_favorites');
                renderFavorites();
            }
        });
    }

    // Sự kiện tìm kiếm gửi request lên Backend
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                fetchRecommendations(query);
            } else {
                alert('Vui lòng nhập tên bài hát hoặc ca sĩ để tìm kiếm!');
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
});