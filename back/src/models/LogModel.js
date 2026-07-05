const pool = require('../config/database');

const RegistroDoseModel = {

  formatar(linha) {
    if (!linha) return null;
    const formatarData = (valor) => valor instanceof Date ? valor.toISOString().split('T')[0] : valor;
    return {
      id: linha.id,
      medicamentoId: linha.medicamento_id,
      usuarioId: linha.usuario_id,
      horarioAgendado: linha.horario_agendado,
      tomadoEm: linha.tomado_em ? new Date(linha.tomado_em).toISOString() : null,
      situacao: linha.situacao,
      dataDose: formatarData(linha.data_dose),
      observacao: linha.observacao || null,
      criadoEm: linha.criado_em instanceof Date ? linha.criado_em.toISOString() : linha.criado_em,
    };
  },

  async listarPorUsuario(usuarioId, { dias } = {}) {
    let sql = 'SELECT * FROM registros_doses WHERE usuario_id = ?';
    const parametros = [usuarioId];
    if (dias) {
      sql += ' AND data_dose >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
      parametros.push(dias);
    }
    sql += ' ORDER BY data_dose DESC, horario_agendado DESC';
    const [linhas] = await pool.query(sql, parametros);
    return linhas.map(this.formatar.bind(this));
  },

  async listarHoje(usuarioId) {
    const [linhas] = await pool.query(
      'SELECT * FROM registros_doses WHERE usuario_id = ? AND data_dose = CURDATE()',
      [usuarioId]
    );
    return linhas.map(this.formatar.bind(this));
  },

  async salvar(usuarioId, medicamentoId, horarioAgendado, situacao, observacao = null) {
    const hoje = new Date().toISOString().split('T')[0];
    const tomadoEm = situacao === 'tomada' ? new Date() : null;

    const [existente] = await pool.query(
      'SELECT id FROM registros_doses WHERE medicamento_id = ? AND data_dose = ? AND horario_agendado = ?',
      [medicamentoId, hoje, horarioAgendado]
    );

    if (existente.length) {
      await pool.query(
        'UPDATE registros_doses SET situacao = ?, tomado_em = ?, observacao = ?, usuario_id = ? WHERE id = ?',
        [situacao, tomadoEm, observacao, usuarioId, existente[0].id]
      );
      const [atualizado] = await pool.query('SELECT * FROM registros_doses WHERE id = ?', [existente[0].id]);
      return this.formatar(atualizado[0]);
    }

    const [resultado] = await pool.query(
      `INSERT INTO registros_doses
         (medicamento_id, usuario_id, horario_agendado, tomado_em, situacao, data_dose, observacao)
       VALUES (?,?,?,?,?,?,?)`,
      [medicamentoId, usuarioId, horarioAgendado, tomadoEm, situacao, hoje, observacao]
    );
    const [criado] = await pool.query('SELECT * FROM registros_doses WHERE id = ?', [resultado.insertId]);
    return this.formatar(criado[0]);
  },

  async taxaAdesao(usuarioId, dias = 7) {
    const [linhas] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(situacao = 'tomada') AS tomadas
       FROM registros_doses
       WHERE usuario_id = ? AND data_dose >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [usuarioId, dias]
    );
    const { total, tomadas } = linhas[0];
    if (!total) return 100;
    return Math.round((tomadas / total) * 100);
  },

  async excluirPorMedicamento(medicamentoId, usuarioId) {
    await pool.query(
      'DELETE FROM registros_doses WHERE medicamento_id = ? AND usuario_id = ?',
      [medicamentoId, usuarioId]
    );
  },
};

module.exports = RegistroDoseModel;
