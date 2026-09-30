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
      console.error('JWT_SECRET não configurado no servidor');

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

    const idUsuario = String(decodificado.id);

    if (!mongoose.Types.ObjectId.isValid(idUsuario)) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'ID de usuário inválido',
      });
    }

    const usuario = await UsuarioModel.buscarPorId(idUsuario);

    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado',
      });
    }

    /*
     * IMPORTANTE:
     * O usuário é reconstruído a partir do banco.
     * Nunca confiamos em um userId enviado pelo frontend.
     */
    req.usuario = UsuarioModel.formatar(usuario);

    /*
     * Guardamos também o ObjectId original.
     * Isso facilita usar o ID diretamente nos models.
     */
    req.usuarioId = usuario._id.toString();

    next();
  } catch (erro) {
    console.error('Erro na autenticação:', erro.message);

    if (erro.name === 'TokenExpiredError') {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Sessão expirada, faça login novamente',
      });
    }

    if (
      erro.name === 'JsonWebTokenError' ||
      erro.name === 'NotBeforeError'
    ) {
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