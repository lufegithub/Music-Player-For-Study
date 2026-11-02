const db = require('../config/database');

const Artist = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM artists ORDER BY name');
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM artists WHERE id = ?', [id]);
    return rows[0] || null;
  },

  /** Retorna o id do artista com esse nome, criando-o se não existir. */
  async findOrCreate(name) {
    const [result] = await db.query(
      'INSERT INTO artists (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
      [name]
    );
    return result.insertId;
  },
};

module.exports = Artist;
