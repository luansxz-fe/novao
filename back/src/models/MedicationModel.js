const pool = require('../config/database');

const MedicamentoModel = {

  formatar(linha) {
    if (!linha) return null;
    const formatarData = (valor) => valor instanceof Date ? valor.toISOString().split('T')[0] : valor;
    return {
      id: linha.id,
      usuarioId: linha.usuario_id,
      nome: linha.nome,
      dosagem: linha.dosagem,
      unidade: linha.unidade,
      frequencia: linha.frequencia,
      horarios: typeof linha.horarios === 'string' ? JSON.parse(linha.horarios) : (linha.horarios || []),
      dataInicio: formatarData(linha.data_inicio),
      dataTermino: linha.data_termino ? formatarData(linha.data_termino) : null,
      instrucoes: linha.instrucoes || null,
      cor: linha.cor,
      icone: linha.icone,
      categoria: linha.categoria,
      estoqueAtual: linha.estoque_atual,
      estoqueMaximo: linha.estoque_maximo,
      lembreteAtivo: !!linha.lembrete_ativo,
      ativo: !!linha.ativo,
      urlImagem: linha.url_imagem || null,
      medicoPrescritor: linha.medico_prescritor || null,
      efeitosColaterais: linha.efeitos_colaterais || null,
      criadoEm: linha.criado_em instanceof Date ? linha.criado_em.toISOString() : linha.criado_em,
    };
  },

  async listarPorUsuario(usuarioId) {
    const [linhas] = await pool.query(
      'SELECT * FROM medicamentos WHERE usuario_id = ? ORDER BY criado_em DESC',
      [usuarioId]
    );
    return linhas.map(this.formatar.bind(this));
  },

  async buscarUm(id, usuarioId) {
    const [linhas] = await pool.query(
      'SELECT * FROM medicamentos WHERE id = ? AND usuario_id = ? LIMIT 1',
      [id, usuarioId]
    );
    return this.formatar(linhas[0]);
  },

  async criar(usuarioId, dados) {
    const [resultado] = await pool.query(
      `INSERT INTO medicamentos
         (usuario_id, nome, dosagem, unidade, frequencia, horarios,
          data_inicio, data_termino, instrucoes, cor, icone, categoria,
          estoque_atual, estoque_maximo, lembrete_ativo, ativo,
          url_imagem, medico_prescritor, efeitos_colaterais)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        usuarioId,
        dados.nome, dados.dosagem, dados.unidade, dados.frequencia,
        JSON.stringify(dados.horarios),
        dados.dataInicio,
        dados.dataTermino || null,
        dados.instrucoes || null,
        dados.cor, dados.icone, dados.categoria,
        dados.estoqueAtual ?? 30,
        dados.estoqueMaximo ?? 30,
        dados.lembreteAtivo ? 1 : 0,
        dados.ativo !== false ? 1 : 0,
        dados.urlImagem || null,
        dados.medicoPrescritor || null,
        dados.efeitosColaterais || null,
      ]
    );
    return this.buscarUm(resultado.insertId, usuarioId);
  },

  async atualizar(id, usuarioId, dados) {
    const mapaColunas = {
      nome: 'nome',
      dosagem: 'dosagem',
      unidade: 'unidade',
      frequencia: 'frequencia',
      horarios: 'horarios',
      dataInicio: 'data_inicio',
      dataTermino: 'data_termino',
      instrucoes: 'instrucoes',
      cor: 'cor',
      icone: 'icone',
      categoria: 'categoria',
      estoqueAtual: 'estoque_atual',
      estoqueMaximo: 'estoque_maximo',
      lembreteAtivo: 'lembrete_ativo',
      ativo: 'ativo',
      urlImagem: 'url_imagem',
      medicoPrescritor: 'medico_prescritor',
      efeitosColaterais: 'efeitos_colaterais',
    };

    const colunas = [];
    const valores = [];

    for (const [chave, coluna] of Object.entries(mapaColunas)) {
      if (dados[chave] === undefined) continue;
      colunas.push(`${coluna} = ?`);
      let valor = dados[chave];
      if (chave === 'horarios') valor = JSON.stringify(valor);
      if (chave === 'lembreteAtivo') valor = valor ? 1 : 0;
      if (chave === 'ativo') valor = valor ? 1 : 0;
      if (valor === '') valor = null;
      valores.push(valor);
    }

    if (!colunas.length) return this.buscarUm(id, usuarioId);

    valores.push(id, usuarioId);
    await pool.query(
      `UPDATE medicamentos SET ${colunas.join(', ')} WHERE id = ? AND usuario_id = ?`,
      valores
    );
    return this.buscarUm(id, usuarioId);
  },

  async excluir(id, usuarioId) {
    const [resultado] = await pool.query(
      'DELETE FROM medicamentos WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return resultado.affectedRows > 0;
  },
};

module.exports = MedicamentoModel;
