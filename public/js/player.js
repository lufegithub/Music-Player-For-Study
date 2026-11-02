/**
 * Player de áudio (frontend).
 * A fila é montada a partir das linhas [data-track] da tabela da página atual.
 */
(() => {
  const audio = document.getElementById('audio');
  const el = {
    cover: document.getElementById('playerCover'),
    title: document.getElementById('playerTitle'),
    artist: document.getElementById('playerArtist'),
    play: document.getElementById('btnPlay'),
    prev: document.getElementById('btnPrev'),
    next: document.getElementById('btnNext'),
    shuffle: document.getElementById('btnShuffle'),
    repeat: document.getElementById('btnRepeat'),
    mute: document.getElementById('btnMute'),
    seek: document.getElementById('seek'),
    volume: document.getElementById('volume'),
    current: document.getElementById('timeCurrent'),
    total: document.getElementById('timeTotal'),
  };

  const DEFAULT_COVER = '/img/default-cover.svg';
  const state = { queue: [], index: -1, shuffle: false, repeat: false, seeking: false };

  const fmt = (s) => {
    if (!Number.isFinite(s)) return '0:00';
    s = Math.floor(s);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const rows = () => Array.from(document.querySelectorAll('.track-list [data-track]'));
  const readQueue = () => rows().map((r) => JSON.parse(r.dataset.track));

  function highlightCurrent() {
    const current = state.queue[state.index];
    rows().forEach((r) => {
      const isCurrent = current && JSON.parse(r.dataset.track).id === current.id;
      r.classList.toggle('is-current', isCurrent);
      const icon = r.querySelector('.track-play i');
      if (icon) icon.className = `bi ${isCurrent && !audio.paused ? 'bi-pause-fill' : 'bi-play-fill'} fs-5`;
    });
  }

  function updatePlayIcon() {
    el.play.innerHTML = `<i class="bi ${audio.paused ? 'bi-play-fill' : 'bi-pause-fill'}"></i>`;
    highlightCurrent();
  }

  function load(index, autoplay = true) {
    if (index < 0 || index >= state.queue.length) return;
    state.index = index;
    const track = state.queue[index];

    audio.src = track.streamUrl;
    el.cover.src = track.coverUrl;
    el.title.textContent = track.title;
    el.artist.textContent = track.artist;
    document.title = `${track.title} · ${track.artist}`;

    if (autoplay) {
      audio.play().catch(() => {});
      fetch(`/api/tracks/${track.id}/play`, { method: 'POST' }).catch(() => {});
    }
    updateMediaSession(track);
    highlightCurrent();
  }

  function playFrom(index) {
    state.queue = readQueue();
    load(index);
  }

  function togglePlay() {
    if (state.index === -1) {
      if (rows().length) playFrom(0);
      return;
    }
    audio.paused ? audio.play() : audio.pause();
  }

  function next(auto = false) {
    if (!state.queue.length) return;
    if (state.shuffle) {
      let i = Math.floor(Math.random() * state.queue.length);
      if (state.queue.length > 1 && i === state.index) i = (i + 1) % state.queue.length;
      return load(i);
    }
    if (state.index + 1 < state.queue.length) return load(state.index + 1);
    if (state.repeat || !auto) return load(0);
    audio.pause(); // fim da fila
  }

  function prev() {
    if (!state.queue.length) return;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    load(state.index > 0 ? state.index - 1 : state.queue.length - 1);
  }

  function updateMediaSession(track) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      artwork: [{ src: track.coverUrl }],
    });
  }

  // ---------- Eventos do <audio> ----------
  audio.addEventListener('play', updatePlayIcon);
  audio.addEventListener('pause', updatePlayIcon);
  audio.addEventListener('ended', () => next(true));
  audio.addEventListener('loadedmetadata', () => {
    el.seek.max = audio.duration || 0;
    el.total.textContent = fmt(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    if (state.seeking) return;
    el.seek.value = audio.currentTime;
    el.current.textContent = fmt(audio.currentTime);
  });

  // ---------- Controles ----------
  el.play.addEventListener('click', togglePlay);
  el.next.addEventListener('click', () => next());
  el.prev.addEventListener('click', prev);

  el.shuffle.addEventListener('click', () => {
    state.shuffle = !state.shuffle;
    el.shuffle.classList.toggle('active', state.shuffle);
  });
  el.repeat.addEventListener('click', () => {
    state.repeat = !state.repeat;
    el.repeat.classList.toggle('active', state.repeat);
  });

  el.seek.addEventListener('input', () => {
    state.seeking = true;
    el.current.textContent = fmt(Number(el.seek.value));
  });
  el.seek.addEventListener('change', () => {
    audio.currentTime = Number(el.seek.value);
    state.seeking = false;
  });

  const setVolumeIcon = () => {
    const v = audio.muted ? 0 : audio.volume;
    const icon = v === 0 ? 'bi-volume-mute-fill' : v < 0.5 ? 'bi-volume-down-fill' : 'bi-volume-up-fill';
    el.mute.innerHTML = `<i class="bi ${icon}"></i>`;
  };
  audio.volume = Number(el.volume.value);
  el.volume.addEventListener('input', () => {
    audio.volume = Number(el.volume.value);
    audio.muted = false;
    setVolumeIcon();
  });
  el.mute.addEventListener('click', () => {
    audio.muted = !audio.muted;
    setVolumeIcon();
  });

  // ---------- Lista de faixas ----------
  document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.js-play');
    if (playBtn) {
      const row = playBtn.closest('[data-track]');
      const id = JSON.parse(row.dataset.track).id;
      const current = state.queue[state.index];
      if (current && current.id === id) return togglePlay();
      return playFrom(rows().indexOf(row));
    }
    if (e.target.closest('.js-play-all')) playFrom(0);
  });

  // Duplo clique na linha também toca
  document.addEventListener('dblclick', (e) => {
    const row = e.target.closest('.track-list [data-track]');
    if (row) playFrom(rows().indexOf(row));
  });

  // ---------- Atalhos de teclado ----------
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    if (e.code === 'ArrowRight' && e.shiftKey) next();
    if (e.code === 'ArrowLeft' && e.shiftKey) prev();
  });

  // ---------- Media Session (teclas de mídia do sistema) ----------
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', prev);
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
  }

  el.cover.addEventListener('error', () => { el.cover.src = DEFAULT_COVER; });
})();
