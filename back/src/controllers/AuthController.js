const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UserModel');
const TokenModel = require('../models/TokenModel');
const { enviarEmailRecuperacao } = require('../services/emailService');

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

const AuthController = {

  async registrar(req, res, next) {
    try {
      const { nome, email, senha } = req.body;

      const existe = await UsuarioModel.buscarPorEmail(email);
      if (existe) {
        return res.status(409).json({ sucesso: false, mensagem: 'Este e-mail ja esta cadastrado' });
      }

      const usuario = await UsuarioModel.criar({ nome, email, senha });
      const token = gerarToken(usuario);

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Conta criada com sucesso',
        token,
        usuario: UsuarioModel.formatar(usuario),
      });
    } catch (erro) { next(erro); }
  },

  async login(req, res, next) {
    try {
      const { email, senha } = req.body;

      const usuario = await UsuarioModel.buscarPorEmail(email);
      if (!usuario) {
        return res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha incorretos' });
      }

      const valida = await UsuarioModel.verificarSenha(senha, usuario.senha);
      if (!valida) {
        return res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha incorretos' });
      }

      const token = gerarToken(usuario);
      return res.json({
        sucesso: true,
        mensagem: 'Login realizado com sucesso',
        token,
        usuario: UsuarioModel.formatar(usuario),
      });
    } catch (erro) { next(erro); }
  },

  async meusDados(req, res) {
    return res.json({ sucesso: true, usuario: UsuarioModel.formatar(req.usuario) });
  },

  async atualizarMeusDados(req, res, next) {
    try {
      const { nome, avatar } = req.body;
      const atualizado = await UsuarioModel.atualizar(req.usuario.id, { nome, avatar });
      return res.json({ sucesso: true, usuario: UsuarioModel.formatar(atualizado) });
    } catch (erro) { next(erro); }
  },

  async esqueciSenha(req, res, next) {
    try {
      const { email } = req.body;
      const usuario = await UsuarioModel.buscarPorEmail(email);

      if (!usuario) {
        return res.json({
          sucesso: true,
          mensagem: 'Se o e-mail estiver cadastrado, voce recebera o codigo em breve',
        });
      }

      const token = await TokenModel.criar(usuario.id);

      try {
        await enviarEmailRecuperacao(usuario.email, usuario.nome, token);
      } catch (erroEmail) {
        console.error('Falha ao enviar e-mail:', erroEmail.message);
        if (process.env.NODE_ENV !== 'production') {
          return res.json({
            sucesso: true,
            mensagem: 'Nao foi possivel enviar o e-mail. Verifique as configuracoes SMTP no .env',
            tokenDesenvolvimento: token,
          });
        }
        return res.status(500).json({
          sucesso: false,
          mensagem: 'Erro ao enviar e-mail. Tente novamente mais tarde',
        });
      }

      return res.json({
        sucesso: true,
        mensagem: 'Codigo de recuperacao enviado para seu e-mail',
      });
    } catch (erro) { next(erro); }
  },

  async redefinirSenha(req, res, next) {
    try {
      const { token, novaSenha } = req.body;

      const registro = await TokenModel.buscarValido(token);
      if (!registro) {
        return res.status(400).json({ sucesso: false, mensagem: 'Codigo invalido ou expirado' });
      }

      const usuario = await UsuarioModel.buscarPorEmail(registro.email);
      await UsuarioModel.alterarSenha(usuario.id, novaSenha);
      await TokenModel.marcarUtilizado(token);

      return res.json({ sucesso: true, mensagem: 'Senha redefinida com sucesso' });
    } catch (erro) { next(erro); }
  },
};

module.exports = AuthController;
