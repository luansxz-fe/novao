const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UserModel');

async function autenticar(req, res, next) {
  try {
    const cabecalho = req.headers['authorization'];
    if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
      return res.status(401).json({ sucesso: false, mensagem: 'Token não fornecido' });
    }

    const token = cabecalho.split(' ')[1];
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await UsuarioModel.buscarPorId(decodificado.id);
    if (!usuario) {
      return res.status(401).json({ sucesso: false, mensagem: 'Usuário não encontrado' });
    }

    req.usuario = UsuarioModel.formatar(usuario);
    next();
  } catch (erro) {
    if (erro.name === 'TokenExpiredError') {
      return res.status(401).json({ sucesso: false, mensagem: 'Sessão expirada, faça login novamente' });
    }
    return res.status(401).json({ sucesso: false, mensagem: 'Token inválido' });
  }
}

module.exports = autenticar;