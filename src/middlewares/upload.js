const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { AUDIO_DIR, COVER_DIR } = require('../config/storage');
const { httpError } = require('./errorHandler');

const MAX_MB = Number(process.env.MAX_UPLOAD_MB) || 50;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, file.fieldname === 'cover' ? COVER_DIR : AUDIO_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (file.fieldname === 'audio' && file.mimetype.startsWith('audio/')) return cb(null, true);
  if (file.fieldname === 'cover' && file.mimetype.startsWith('image/')) return cb(null, true);
  cb(httpError(400, `Tipo de arquivo inválido para "${file.fieldname}": ${file.mimetype}`));
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_MB * 1024 * 1024 } });

module.exports = {
  trackUpload: upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
};
