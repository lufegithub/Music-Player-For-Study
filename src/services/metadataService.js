/**
 * Lê metadados (ID3/Vorbis/etc.) do arquivo de áudio:
 * título, artista, álbum, nº da faixa, duração e a capa embutida.
 */
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const mm = require('music-metadata');
const { COVER_DIR } = require('../config/storage');

const MIME_EXT = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

async function extract(filePath) {
  try {
    const { common, format } = await mm.parseFile(filePath, { duration: true });
    return {
      title: common.title || null,
      artist: common.artist || null,
      album: common.album || null,
      year: common.year || null,
      genre: common.genre?.[0] || null,
      trackNumber: common.track?.no || null,
      duration: format.duration ? Math.round(format.duration) : null,
      picture: common.picture?.[0] || null,
    };
  } catch (err) {
    console.warn(`Não foi possível ler metadados de ${path.basename(filePath)}: ${err.message}`);
    return {};
  }
}

/** Salva a capa embutida no áudio e retorna o caminho relativo (ex.: "covers/abc.jpg"). */
async function saveEmbeddedCover(picture) {
  if (!picture?.data) return null;
  const ext = MIME_EXT[picture.format] || '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  await fs.writeFile(path.join(COVER_DIR, filename), picture.data);
  return `covers/${filename}`;
}

module.exports = { extract, saveEmbeddedCover };
