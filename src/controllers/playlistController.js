const Playlist = require('../models/Playlist');
const Track = require('../models/Track');
const { httpError } = require('../middlewares/errorHandler');
const { toDTO } = require('./trackController');

// GET /playlists
exports.index = async (req, res) => {
  const playlists = await Playlist.findAll();
  res.render('playlists/index', { title: 'Playlists', playlists });
};

// POST /playlists
exports.create = async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) throw httpError(400, 'Informe o nome da playlist.');
  const id = await Playlist.create({ name, description: (req.body.description || '').trim() || null });
  res.redirect(`/playlists/${id}`);
};

// GET /playlists/:id
exports.show = async (req, res) => {
  const playlist = await Playlist.findById(req.params.id);
  if (!playlist) throw httpError(404, 'Playlist não encontrada.');
  const tracks = await Playlist.getTracks(playlist.id);
  res.render('playlists/show', {
    title: playlist.name,
    playlist,
    tracks: tracks.map((t) => ({ ...t, dto: toDTO(t) })),
  });
};

// POST /playlists/:id/delete
exports.destroy = async (req, res) => {
  await Playlist.remove(req.params.id);
  res.redirect('/playlists');
};

// POST /playlists/:id/tracks   (body: track_id)
exports.addTrack = async (req, res) => {
  const playlist = await Playlist.findById(req.params.id);
  const track = await Track.findById(req.body.track_id);
  if (!playlist || !track) throw httpError(404, 'Playlist ou faixa não encontrada.');
  await Playlist.addTrack(playlist.id, track.id);
  res.redirect(req.get('Referer') || `/playlists/${playlist.id}`);
};

// POST /playlists/:id/tracks/:trackId/delete
exports.removeTrack = async (req, res) => {
  await Playlist.removeTrack(req.params.id, req.params.trackId);
  res.redirect(`/playlists/${req.params.id}`);
};
