const db = require('../config/database');

const BASE_SELECT = `
  SELECT t.id, t.title, t.track_number, t.duration_seconds, t.audio_path, t.cover_path,
         t.mime_type, t.file_size, t.play_count, t.created_at,
         ar.id AS artist_id, ar.name AS artist_name,
         al.id AS album_id, al.title AS album_title, al.cover_path AS album_cover_path,
         g.id  AS genre_id,  g.name  AS genre_name
    FROM tracks t
    LEFT JOIN artists ar ON ar.id = t.artist_id
    LEFT JOIN albums  al ON al.id = t.album_id
    LEFT JOIN genres  g  ON g.id  = t.genre_id`;

const Track = {
  async findAll({ search = '' } = {}) {
    const params = [];
    let where = '';
    if (search) {
      where = 'WHERE t.title LIKE ? OR ar.name LIKE ? OR al.title LIKE ?';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    const [rows] = await db.query(`${BASE_SELECT} ${where} ORDER BY t.created_at DESC, t.id DESC`, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query(`${BASE_SELECT} WHERE t.id = ?`, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await db.query(
      `INSERT INTO tracks
         (title, artist_id, album_id, genre_id, track_number, duration_seconds,
          audio_path, cover_path, mime_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.artistId ?? null,
        data.albumId ?? null,
        data.genreId ?? null,
        data.trackNumber ?? null,
        data.durationSeconds ?? null,
        data.audioPath,
        data.coverPath ?? null,
        data.mimeType ?? null,
        data.fileSize ?? null,
      ]
    );
    return result.insertId;
  },

  async remove(id) {
    const [result] = await db.query('DELETE FROM tracks WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async incrementPlayCount(id) {
    await db.query('UPDATE tracks SET play_count = play_count + 1 WHERE id = ?', [id]);
  },

  /** Verifica se um arquivo de capa ainda é usado por alguma faixa ou álbum. */
  async isCoverInUse(coverPath) {
    const [rows] = await db.query(
      `SELECT (SELECT COUNT(*) FROM tracks WHERE cover_path = ?)
            + (SELECT COUNT(*) FROM albums WHERE cover_path = ?) AS total`,
      [coverPath, coverPath]
    );
    return rows[0].total > 0;
  },
};

module.exports = Track;
