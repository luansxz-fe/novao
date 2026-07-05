const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const UsuarioModel = {

  async buscarPorEmail(email) {
    const [linhas] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );
    return linhas[0] || null;
  },

  async buscarPorId(id) {
    const [linhas] = await pool.query(
      'SELECT id, nome, email, avatar, criado_em, atualizado_em FROM usuarios WHERE id = ? LIMIT 1',
      [id]
    );
    return linhas[0] || null;
  },

  async criar({ nome, email, senha }) {
    const hash = await bcrypt.hash(senha, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome.trim(), email.toLowerCase().trim(), hash]
    );
    return this.buscarPorId(resultado.insertId);
  },

  async atualizar(id, { nome, avatar }) {
    const campos = [];
    const valores = [];
    if (nome !== undefined) { campos.push('nome = ?'); valores.push(nome.trim()); }
    if (avatar !== undefined) { campos.push('avatar = ?'); valores.push(avatar); }
    if (!campos.length) return this.buscarPorId(id);
    valores.push(id);
    await pool.query(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`, valores);
    return this.buscarPorId(id);
  },

  async alterarSenha(id, novaSenha) {
    const hash = await bcrypt.hash(novaSenha, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    await pool.query('UPDATE usuarios SET senha = ? WHERE id = ?', [hash, id]);
  },

  async verificarSenha(textoPlano, hash) {
    return bcrypt.compare(textoPlano, hash);
  },

  formatar(usuario) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      avatar: usuario.avatar || null,
      criadoEm: usuario.criado_em,
    };
  },
};

module.exports = UsuarioModel;
