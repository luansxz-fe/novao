const mongoose = require('mongoose');

const medicamentoSchema = new mongoose.Schema(
  {
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },

    nome: {
      type: String,
      required: true,
      trim: true,
    },

    dosagem: {
      type: String,
      required: true,
      trim: true,
    },

    unidade: {
      type: String,
      required: true,
      trim: true,
    },

    frequencia: {
      type: String,
      required: true,
      trim: true,
    },

    horarios: {
      type: [String],
      default: [],
    },

    data_inicio: {
      type: Date,
      required: true,
    },

    data_termino: {
      type: Date,
      default: null,
    },

    instrucoes: {
      type: String,
      default: null,
    },

    cor: {
      type: String,
      required: true,
    },

    icone: {
      type: String,
      required: true,
    },

    categoria: {
      type: String,
      required: true,
    },

    estoque_atual: {
      type: Number,
      default: 30,
    },

    estoque_maximo: {
      type: Number,
      default: 30,
    },

    lembrete_ativo: {
      type: Boolean,
      default: true,
    },

    ativo: {
      type: Boolean,
      default: true,
    },

    url_imagem: {
      type: String,
      default: null,
    },

    medico_prescritor: {
      type: String,
      default: null,
    },

    efeitos_colaterais: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'criado_em',
      updatedAt: 'atualizado_em',
    },
  }
);

medicamentoSchema.index({
  usuario_id: 1,
  criado_em: -1,
});

medicamentoSchema.index({
  usuario_id: 1,
  ativo: 1,
});

const Medicamento =
  mongoose.model(
    'Medicamento',
    medicamentoSchema
  );

function validarUsuarioId(usuarioId) {
  return (
    usuarioId &&
    mongoose.Types.ObjectId.isValid(
      String(usuarioId)
    )
  );
}

function formatarData(valor) {
  if (!valor) return null;

  if (valor instanceof Date) {
    return valor.toISOString().split('T')[0];
  }

  return String(valor).slice(0, 10);
}

const MedicamentoModel = {
  formatar(doc) {
    if (!doc) return null;

    return {
      id: doc._id.toString(),

      usuarioId: doc.usuario_id
        ? doc.usuario_id.toString()
        : null,

      nome: doc.nome,
      dosagem: doc.dosagem,
      unidade: doc.unidade,
      frequencia: doc.frequencia,

      horarios: Array.isArray(doc.horarios)
        ? doc.horarios
        : [],

      dataInicio: formatarData(
        doc.data_inicio
      ),

      dataTermino: formatarData(
        doc.data_termino
      ),

      instrucoes:
        doc.instrucoes || null,

      cor: doc.cor,
      icone: doc.icone,
      categoria: doc.categoria,

      estoqueAtual:
        doc.estoque_atual,

      estoqueMaximo:
        doc.estoque_maximo,

      lembreteAtivo:
        !!doc.lembrete_ativo,

      ativo:
        !!doc.ativo,

      urlImagem:
        doc.url_imagem || null,

      medicoPrescritor:
        doc.medico_prescritor || null,

      efeitosColaterais:
        doc.efeitos_colaterais || null,

      criadoEm:
        doc.criado_em instanceof Date
          ? doc.criado_em.toISOString()
          : doc.criado_em,
    };
  },

  async listarPorUsuario(usuarioId) {
    if (!validarUsuarioId(usuarioId)) {
      return [];
    }

    const documentos =
      await Medicamento.find({
        usuario_id: new mongoose.Types.ObjectId(
          String(usuarioId)
        ),
      })
        .sort({
          criado_em: -1,
        })
        .lean();

    return documentos.map(
      (doc) => this.formatar(doc)
    );
  },

  async buscarUm(id, usuarioId) {
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !validarUsuarioId(usuarioId)
    ) {
      return null;
    }

    const doc =
      await Medicamento.findOne({
        _id: id,
        usuario_id:
          new mongoose.Types.ObjectId(
            String(usuarioId)
          ),
      }).lean();

    return this.formatar(doc);
  },

  async criar(usuarioId, dados) {
    if (!validarUsuarioId(usuarioId)) {
      throw new Error(
        'Usuário inválido para criar medicamento'
      );
    }

    const novoMedicamento =
      new Medicamento({
        /*
         * NUNCA pegamos usuarioId do body.
         * Sempre vem do JWT.
         */
        usuario_id:
          new mongoose.Types.ObjectId(
            String(usuarioId)
          ),

        nome: dados.nome,
        dosagem: dados.dosagem,
        unidade: dados.unidade,
        frequencia: dados.frequencia,

        horarios: Array.isArray(
          dados.horarios
        )
          ? dados.horarios
          : [],

        data_inicio:
          dados.dataInicio,

        data_termino:
          dados.dataTermino || null,

        instrucoes:
          dados.instrucoes || null,

        cor:
          dados.cor || '#3b82f6',

        icone:
          dados.icone || 'Pill',

        categoria:
          dados.categoria || 'Geral',

        estoque_atual:
          dados.estoqueAtual ?? 30,

        estoque_maximo:
          dados.estoqueMaximo ?? 30,

        lembrete_ativo:
          dados.lembreteAtivo !== undefined
            ? !!dados.lembreteAtivo
            : true,

        ativo:
          dados.ativo !== false,

        url_imagem:
          dados.urlImagem || null,

        medico_prescritor:
          dados.medicoPrescritor || null,

        efeitos_colaterais:
          dados.efeitosColaterais || null,
      });

    const salvo =
      await novoMedicamento.save();

    return this.formatar(salvo);
  },

  async atualizar(
    id,
    usuarioId,
    dados
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !validarUsuarioId(usuarioId)
    ) {
      return null;
    }

    const mapaCampos = {
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
      efeitosColaterais:
        'efeitos_colaterais',
    };

    const atualizacao = {};

    for (
      const [chave, campoDoc]
      of Object.entries(mapaCampos)
    ) {
      if (dados[chave] === undefined) {
        continue;
      }

      let valor = dados[chave];

      if (valor === '') {
        valor = null;
      }

      atualizacao[campoDoc] = valor;
    }

    if (
      Object.keys(atualizacao).length === 0
    ) {
      return this.buscarUm(
        id,
        usuarioId
      );
    }

    /*
     * O filtro contém:
     *
     * _id = medicamento
     * usuario_id = usuário autenticado
     *
     * Portanto um usuário não consegue
     * atualizar o medicamento de outro.
     */
    const docAtualizado =
      await Medicamento.findOneAndUpdate(
        {
          _id: id,

          usuario_id:
            new mongoose.Types.ObjectId(
              String(usuarioId)
            ),
        },
        {
          $set: atualizacao,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    return this.formatar(
      docAtualizado
    );
  },

  async excluir(
    id,
    usuarioId
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !validarUsuarioId(usuarioId)
    ) {
      return false;
    }

    const resultado =
      await Medicamento.deleteOne({
        _id: id,

        usuario_id:
          new mongoose.Types.ObjectId(
            String(usuarioId)
          ),
      });

    return resultado.deletedCount > 0;
  },
};

module.exports = MedicamentoModel;