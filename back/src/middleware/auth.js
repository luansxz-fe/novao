const jwt = require('jsonwebtoken');
const pool = require('../config/database');

async function autenticar(req, res, next) {
  try {
    const cabecalho = req.headers['authorization'];
    if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
      return res.status(401).json({ sucesso: false, mensagem: 'Token não fornecido' });
    }
    const token = cabecalho.split(' ')[1];
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    const [linhas] = await pool.query(
      'SELECT id, nome, email, avatar, criado_em FROM usuarios WHERE id = ? LIMIT 1',
      [decodificado.id]
    );
    if (!linhas.length) {
      return res.status(401).json({ sucesso: false, mensagem: 'Usuário não encontrado' });
    }
    req.usuario = linhas[0];
    next();
  } catch (erro) {
    if (erro.name === 'TokenExpiredError') {
      return res.status(401).json({ sucesso: false, mensagem: 'Sessão expirada, faça login novamente' });
    }
    return res.status(401).json({ sucesso: false, mensagem: 'Token inválido' });
  }
}

module.exports = autenticar;
