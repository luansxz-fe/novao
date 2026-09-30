const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    senha: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
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

const Usuario = mongoose.model(
  'Usuario',
  usuarioSchema
);

const UsuarioModel = {
  async buscarPorEmail(email) {
    if (!email) {
      return null;
    }

    return await Usuario.findOne({
      email: email.toLowerCase().trim(),
    });
  },

  async buscarPorId(id) {
    if (!id) {
      return null;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return await Usuario.findById(id);
  },

  async criar({ nome, email, senha }) {
    const hash = await bcrypt.hash(
      senha,
      parseInt(
        process.env.BCRYPT_ROUNDS || '12',
        10
      )
    );

    const novoUsuario = new Usuario({
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      senha: hash,
    });

    return await novoUsuario.save();
  },

  async atualizar(id, { nome, avatar }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const camposAtualizacao = {};

    if (nome !== undefined) {
      camposAtualizacao.nome = nome.trim();
    }

    if (avatar !== undefined) {
      camposAtualizacao.avatar = avatar;
    }

    if (
      Object.keys(camposAtualizacao).length === 0
    ) {
      return this.buscarPorId(id);
    }

    return await Usuario.findByIdAndUpdate(
      id,
      camposAtualizacao,
      {
        new: true,
      }
    );
  },

  async alterarSenha(id, novaSenha) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return;
    }

    const hash = await bcrypt.hash(
      novaSenha,
      parseInt(
        process.env.BCRYPT_ROUNDS || '12',
        10
      )
    );

    await Usuario.findByIdAndUpdate(
      id,
      {
        senha: hash,
      }
    );
  },

  async verificarSenha(textoPlano, hash) {
    return bcrypt.compare(
      textoPlano,
      hash
    );
  },

  formatar(usuario) {
    if (!usuario) {
      return null;
    }

    return {
      id: usuario._id
        ? usuario._id.toString()
        : usuario.id,

      nome: usuario.nome,

      email: usuario.email,

      avatar: usuario.avatar || null,

      criadoEm: usuario.criado_em,
    };
  },
};

module.exports = UsuarioModel;