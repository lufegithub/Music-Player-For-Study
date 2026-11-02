const { Router } = require('express');
const h = require('../utils/asyncHandler');
const { trackUpload } = require('../middlewares/upload');
const tracks = require('../controllers/trackController');
const playlists = require('../controllers/playlistController');

const router = Router();

// ----- Páginas: faixas -----
router.get('/', h(tracks.index));
router.get('/tracks/new', h(tracks.newForm));
router.post('/tracks', trackUpload, h(tracks.create));
router.post('/tracks/:id/delete', h(tracks.destroy));
router.get('/tracks/:id/stream', h(tracks.stream));
router.get('/tracks/:id/cover', h(tracks.cover));

// ----- Páginas: playlists -----
router.get('/playlists', h(playlists.index));
router.post('/playlists', h(playlists.create));
router.get('/playlists/:id', h(playlists.show));
router.post('/playlists/:id/delete', h(playlists.destroy));
router.post('/playlists/:id/tracks', h(playlists.addTrack));
router.post('/playlists/:id/tracks/:trackId/delete', h(playlists.removeTrack));

// ----- API JSON -----
router.get('/api/tracks', h(tracks.apiList));
router.get('/api/tracks/:id', h(tracks.apiShow));
router.post('/api/tracks/:id/play', h(tracks.apiRegisterPlay));

module.exports = router;
