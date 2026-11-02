const fs = require('fs/promises');
const path = require('path');

const Track = require('../models/Track');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Genre = require('../models/Genre');
const Playlist = require('../models/Playlist');
const metadataService = require('../services/metadataService');
const { resolveUpload } = require('../config/storage');
const { httpError } = require('../middlewares/errorHandler');

const DEFAULT_COVER = '/img/default-cover.svg';

async function safeUnlink(relativePath) {
  const abs = resolveUpload(relativePath);
  if (abs) await fs.unlink(abs).catch(() => {});
}

/** Formato usado pela API/player no frontend. */
function toDTO(track) {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist_name || 'Artista desconhecido',
    album: track.album_title || null,
    duration: track.duration_seconds,
    streamUrl: `/tracks/${track.id}/stream`,
    coverUrl: `/tracks/${track.id}/cover`,
  };
}

// GET /
exports.index = async (req, res) => {
  const q = (req.query.q || '').trim();
  const [tracks, playlists] = await Promise.all([Track.findAll({ search: q }), Playlist.findAll()]);
  res.render('tracks/index', { title: 'Biblioteca', tracks: tracks.map((t) => ({ ...t, dto: toDTO(t) })), playlists, q });
};

// GET /tracks/new
exports.newForm = async (req, res) => {
  const genres = await Genre.findAll();
  res.render('tracks/new', { title: 'Enviar faixa', genres, values: {}, error: null });
};

// POST /tracks
exports.create = async (req, res) => {
  const audio = req.files?.audio?.[0];
  const cover = req.files?.cover?.[0];

  if (!audio) {
    if (cover) await safeUnlink(`covers/${cover.filename}`);
    const genres = await Genre.findAll();
    return res.status(400).render('tracks/new', {
      title: 'Enviar faixa', genres, values: req.body, error: 'Selecione um arquivo de áudio.',
    });
  }

  const meta = await metadataService.extract(audio.path);
  const body = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, String(v).trim()]));

  // Prioridade: valor do formulário > metadados do arquivo > fallback
  const title = body.title || meta.title || path.parse(audio.originalname).name;
  const artistName = body.artist || meta.artist;
  const albumTitle = body.album || meta.album;

  // Capa: upload manual > capa embutida no áudio > (null => capa do álbum / padrão)
  const coverPath = cover
    ? `covers/${cover.filename}`
    : await metadataService.saveEmbeddedCover(meta.picture);

  const artistId = artistName ? await Artist.findOrCreate(artistName) : null;
  const albumId = albumTitle
    ? await Album.findOrCreate({ title: albumTitle, artistId, releaseYear: meta.year, coverPath })
    : null;

  let genreId = body.genre_id ? Number(body.genre_id) : null;
  if (!genreId && meta.genre) genreId = await Genre.findOrCreate(meta.genre);

  await Track.create({
    title,
    artistId,
    albumId,
    genreId,
    trackNumber: body.track_number ? Number(body.track_number) : meta.trackNumber,
    durationSeconds: meta.duration,
    audioPath: `audio/${audio.filename}`,
    coverPath,
    mimeType: audio.mimetype,
    fileSize: audio.size,
  });

  res.redirect('/');
};

// POST /tracks/:id/delete
exports.destroy = async (req, res) => {
  const track = await Track.findById(req.params.id);
  if (!track) throw httpError(404, 'Faixa não encontrada.');

  await Track.remove(track.id);
  await safeUnlink(track.audio_path);
  if (track.cover_path && !(await Track.isCoverInUse(track.cover_path))) {
    await safeUnlink(track.cover_path);
  }

  res.redirect(req.get('Referer') || '/');
};

// GET /tracks/:id/stream  (Express/send já trata o header Range => seek funciona)
exports.stream = async (req, res) => {
  const track = await Track.findById(req.params.id);
  const file = track && resolveUpload(track.audio_path);
  if (!file) throw httpError(404, 'Áudio não encontrado.');

  res.sendFile(file, { acceptRanges: true, headers: track.mime_type ? { 'Content-Type': track.mime_type } : {} }, (err) => {
    if (err && !res.headersSent) res.status(404).end();
  });
};

// GET /tracks/:id/cover  -> capa da faixa, senão do álbum, senão padrão
exports.cover = async (req, res) => {
  const track = await Track.findById(req.params.id);
  const file = track && resolveUpload(track.cover_path || track.album_cover_path);
  if (!file) return res.redirect(DEFAULT_COVER);

  res.sendFile(file, { maxAge: '1d' }, (err) => {
    if (err && !res.headersSent) res.redirect(DEFAULT_COVER);
  });
};

// ---------- API JSON ----------

// GET /api/tracks
exports.apiList = async (req, res) => {
  const tracks = await Track.findAll({ search: (req.query.q || '').trim() });
  res.json(tracks.map(toDTO));
};

// GET /api/tracks/:id
exports.apiShow = async (req, res) => {
  const track = await Track.findById(req.params.id);
  if (!track) throw httpError(404, 'Faixa não encontrada.');
  res.json(toDTO(track));
};

// POST /api/tracks/:id/play
exports.apiRegisterPlay = async (req, res) => {
  await Track.incrementPlayCount(req.params.id);
  res.status(204).end();
};

exports.toDTO = toDTO;
