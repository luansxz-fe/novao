const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema =
  new mongoose.Schema(
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

const Usuario =
  mongoose.model(
    'Usuario',
    usuarioSchema
  );

const UsuarioModel = {
  async buscarPorEmail(email) {
    if (!email) {
      return null;
    }

    return Usuario.findOne({
      email: email
        .toLowerCase()
        .trim(),
    });
  },

  async buscarPorId(id) {
    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return null;
    }

    return Usuario.findById(id);
  },

  async criar({
    nome,
    email,
    senha,
  }) {
    const rounds = parseInt(
      process.env.BCRYPT_ROUNDS ||
        '12',
      10
    );

    const hash =
      await bcrypt.hash(
        senha,
        rounds
      );

    const novoUsuario =
      new Usuario({
        nome: nome.trim(),
        email: email
          .toLowerCase()
          .trim(),
        senha: hash,
      });

    return novoUsuario.save();
  },

  async atualizar(
    id,
    {
      nome,
      avatar,
    }
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return null;
    }

    const camposAtualizacao = {};

    if (nome !== undefined) {
      camposAtualizacao.nome =
        nome.trim();
    }

    if (avatar !== undefined) {
      camposAtualizacao.avatar =
        avatar;
    }

    if (
      Object.keys(
        camposAtualizacao
      ).length === 0
    ) {
      return this.buscarPorId(id);
    }

    return Usuario.findByIdAndUpdate(
      id,
      camposAtualizacao,
      {
        new: true,
        runValidators: true,
      }
    );
  },

  async alterarSenha(
    id,
    novaSenha
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return;
    }

    const rounds = parseInt(
      process.env.BCRYPT_ROUNDS ||
        '12',
      10
    );

    const hash =
      await bcrypt.hash(
        novaSenha,
        rounds
      );

    await Usuario.findByIdAndUpdate(
      id,
      {
        senha: hash,
      }
    );
  },

  async verificarSenha(
    textoPlano,
    hash
  ) {
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
      id: usuario._id.toString(),

      nome: usuario.nome,

      email: usuario.email,

      avatar:
        usuario.avatar || null,

      criadoEm:
        usuario.criado_em,
    };
  },
};

module.exports =
  UsuarioModel;