function tratarErro(erro, req, res, next) {
  console.error(`${new Date().toISOString()} ERRO:`, erro.message);
  if (process.env.NODE_ENV === 'development') console.error(erro.stack);

  const status = erro.status || 500;
  const mensagem = erro.message || 'Erro interno do servidor';
  res.status(status).json({ sucesso: false, mensagem });
}

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ sucesso: false, mensagem: `Rota não encontrada: ${req.originalUrl}` });
}

module.exports = { tratarErro, rotaNaoEncontrada };
