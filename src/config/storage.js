const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads');
const AUDIO_DIR = path.join(UPLOAD_DIR, 'audio');
const COVER_DIR = path.join(UPLOAD_DIR, 'covers');

for (const dir of [AUDIO_DIR, COVER_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

/** Converte um caminho relativo salvo no banco (ex.: "audio/x.mp3") em absoluto, sem sair de UPLOAD_DIR. */
function resolveUpload(relativePath) {
  if (!relativePath) return null;
  const abs = path.resolve(UPLOAD_DIR, relativePath);
  if (!abs.startsWith(UPLOAD_DIR + path.sep)) return null;
  return abs;
}

module.exports = { UPLOAD_DIR, AUDIO_DIR, COVER_DIR, resolveUpload };
