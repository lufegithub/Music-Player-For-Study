const multer = require('multer');

function notFound(req, res) {
  res.status(404);
  if (req.path.startsWith('/api/')) return res.json({ error: 'Não encontrado' });
  res.render('error', { title: 'Não encontrado', status: 404, message: 'Página não encontrada.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.expose ? err.message : 'Erro interno do servidor.';

  if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo muito grande.' : err.message;
  }

  if (status >= 500) console.error(err);

  res.status(status);
  if (req.path.startsWith('/api/')) return res.json({ error: message });
  res.render('error', { title: 'Erro', status, message });
}

/** Cria um erro HTTP cuja mensagem pode ser exibida ao usuário. */
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}

module.exports = { notFound, errorHandler, httpError };
