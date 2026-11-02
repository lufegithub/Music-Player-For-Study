const db = require('../config/database');

const Album = {
  async findAll() {
    const [rows] = await db.query(
      `SELECT al.*, ar.name AS artist_name
         FROM albums al
         LEFT JOIN artists ar ON ar.id = al.artist_id
        ORDER BY al.title`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM albums WHERE id = ?', [id]);
    return rows[0] || null;
  },

  /**
   * Retorna o id do álbum (título + artista), criando-o se não existir.
   * Se o álbum ainda não tiver capa e uma for informada, ela é gravada.
   */
  async findOrCreate({ title, artistId = null, releaseYear = null, coverPath = null }) {
    const [rows] = await db.query(
      'SELECT id, cover_path FROM albums WHERE title = ? AND artist_id <=> ? LIMIT 1',
      [title, artistId]
    );

    if (rows[0]) {
      if (!rows[0].cover_path && coverPath) {
        await db.query('UPDATE albums SET cover_path = ? WHERE id = ?', [coverPath, rows[0].id]);
      }
      return rows[0].id;
    }

    const [result] = await db.query(
      'INSERT INTO albums (title, artist_id, release_year, cover_path) VALUES (?, ?, ?, ?)',
      [title, artistId, releaseYear, coverPath]
    );
    return result.insertId;
  },
};

module.exports = Album;
