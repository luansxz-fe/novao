const pool = require('../config/database');
const UsuarioModel = require('../models/UserModel');

const UsuarioController = {

  async listarTodos(req, res, next) {
    try {
      const [linhas] = await pool.query(
        'SELECT id, nome, email, avatar, criado_em, atualizado_em FROM usuarios ORDER BY criado_em DESC'
      );
      return res.json({ sucesso: true, total: linhas.length, usuarios: linhas });
    } catch (erro) { next(erro); }
  },

  async buscarPorId(req, res, next) {
    try {
      const usuario = await UsuarioModel.buscarPorId(req.params.id);
      if (!usuario) {
        return res.status(404).json({ sucesso: false, mensagem: 'Usuario nao encontrado' });
      }
      return res.json({ sucesso: true, usuario: UsuarioModel.formatar(usuario) });
    } catch (erro) { next(erro); }
  },
};

module.exports = UsuarioController;
