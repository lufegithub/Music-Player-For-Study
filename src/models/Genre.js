const db = require('../config/database');

const Genre = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM genres ORDER BY name');
    return rows;
  },

  async findOrCreate(name) {
    const [result] = await db.query(
      'INSERT INTO genres (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
      [name]
    );
    return result.insertId;
  },
};

module.exports = Genre;
