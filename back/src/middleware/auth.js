const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const UsuarioModel = require('../models/UserModel');

async function autenticar(req, res, next) {
  try {
    const cabecalho = req.headers.authorization;

    if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token não fornecido',
      });
    }

    const token = cabecalho.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token não fornecido',
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado');

      return res.status(500).json({
        sucesso: false,
        mensagem: 'Configuração de autenticação ausente',
      });
    }

    const decodificado = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decodificado || !decodificado.id) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido',
      });
    }

    const usuarioId = decodificado.id.toString();

    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'ID de usuário inválido',
      });
    }

    const usuario = await UsuarioModel.buscarPorId(usuarioId);

    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado',
      });
    }

    // ID oficial do usuário autenticado
    req.usuarioId = usuario._id.toString();

    // Dados do usuário
    req.usuario = usuario;

    next();
  } catch (erro) {
    console.error('Erro de autenticação:', erro.message);

    if (erro.name === 'TokenExpiredError') {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Sessão expirada, faça login novamente',
      });
    }

    if (erro.name === 'JsonWebTokenError') {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido',
      });
    }

    return res.status(401).json({
      sucesso: false,
      mensagem: 'Não foi possível autenticar o usuário',
    });
  }
}

module.exports = autenticar;