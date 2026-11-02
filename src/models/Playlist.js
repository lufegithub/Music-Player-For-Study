const db = require('../config/database');

const Playlist = {
  async findAll() {
    const [rows] = await db.query(
      `SELECT p.*, COUNT(pt.track_id) AS track_count
         FROM playlists p
         LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
        GROUP BY p.id
        ORDER BY p.name`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM playlists WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ name, description = null }) {
    const [result] = await db.query(
      'INSERT INTO playlists (name, description) VALUES (?, ?)',
      [name, description]
    );
    return result.insertId;
  },

  async remove(id) {
    const [result] = await db.query('DELETE FROM playlists WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getTracks(playlistId) {
    const [rows] = await db.query(
      `SELECT t.id, t.title, t.duration_seconds, t.cover_path,
              ar.name AS artist_name, al.title AS album_title, al.cover_path AS album_cover_path,
              pt.position
         FROM playlist_tracks pt
         JOIN tracks t        ON t.id  = pt.track_id
         LEFT JOIN artists ar ON ar.id = t.artist_id
         LEFT JOIN albums  al ON al.id = t.album_id
        WHERE pt.playlist_id = ?
        ORDER BY pt.position, pt.added_at`,
      [playlistId]
    );
    return rows;
  },

  /** Adiciona a faixa no final da playlist (ignora se já estiver nela). */
  async addTrack(playlistId, trackId) {
    await db.query(
      `INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, position)
       SELECT ?, ?, COALESCE(MAX(position), 0) + 1 FROM playlist_tracks WHERE playlist_id = ?`,
      [playlistId, trackId, playlistId]
    );
  },

  async removeTrack(playlistId, trackId) {
    await db.query('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?', [playlistId, trackId]);
  },
};

module.exports = Playlist;
