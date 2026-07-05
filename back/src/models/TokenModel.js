const pool = require('../config/database');

const TokenModel = {

  gerarCodigo() {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () =>
      caracteres[Math.floor(Math.random() * caracteres.length)]
    ).join('');
  },

  async criar(usuarioId) {
    await pool.query('DELETE FROM tokens_recuperacao_senha WHERE usuario_id = ?', [usuarioId]);
    const token = this.gerarCodigo();
    const expiraEm = new Date(Date.now() + 3600 * 1000);
    await pool.query(
      'INSERT INTO tokens_recuperacao_senha (usuario_id, token, expira_em) VALUES (?, ?, ?)',
      [usuarioId, token, expiraEm]
    );
    return token;
  },

  async buscarValido(token) {
    const [linhas] = await pool.query(
      `SELECT t.*, u.email, u.nome
       FROM tokens_recuperacao_senha t
       JOIN usuarios u ON u.id = t.usuario_id
       WHERE t.token = ? AND t.utilizado = 0 AND t.expira_em > NOW()
       LIMIT 1`,
      [token.toUpperCase()]
    );
    return linhas[0] || null;
  },

  async marcarUtilizado(token) {
    await pool.query(
      'UPDATE tokens_recuperacao_senha SET utilizado = 1 WHERE token = ?',
      [token.toUpperCase()]
    );
  },
};

module.exports = TokenModel;
