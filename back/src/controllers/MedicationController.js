const MedicamentoModel = require('../models/MedicationModel');
const RegistroDoseModel = require('../models/LogModel');

const MedicamentoController = {
  async listar(req, res, next) {
    try {
      const usuarioId = req.usuarioId;

      const medicamentos =
        await MedicamentoModel.listarPorUsuario(
          usuarioId
        );

      return res.json({
        sucesso: true,
        dados: medicamentos,
      });
    } catch (erro) {
      next(erro);
    }
  },

  async buscar(req, res, next) {
    try {
      const medicamento =
        await MedicamentoModel.buscarUm(
          req.params.id,
          req.usuarioId
        );

      if (!medicamento) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Medicamento não encontrado',
        });
      }

      return res.json({
        sucesso: true,
        dados: medicamento,
      });
    } catch (erro) {
      next(erro);
    }
  },

  async criar(req, res, next) {
    try {
      const medicamento =
        await MedicamentoModel.criar(
          req.usuarioId,
          req.body
        );

      if (!medicamento) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Não foi possível criar o medicamento',
        });
      }

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Medicamento criado',
        dados: medicamento,
      });
    } catch (erro) {
      next(erro);
    }
  },

  async atualizar(req, res, next) {
    try {
      const existe =
        await MedicamentoModel.buscarUm(
          req.params.id,
          req.usuarioId
        );

      if (!existe) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Medicamento não encontrado',
        });
      }

      const medicamento =
        await MedicamentoModel.atualizar(
          req.params.id,
          req.usuarioId,
          req.body
        );

      return res.json({
        sucesso: true,
        mensagem: 'Medicamento atualizado',
        dados: medicamento,
      });
    } catch (erro) {
      next(erro);
    }
  },

  async excluir(req, res, next) {
    try {
      /*
       * Primeiro verificamos se o medicamento pertence
       * ao usuário autenticado.
       */
      const medicamento =
        await MedicamentoModel.buscarUm(
          req.params.id,
          req.usuarioId
        );

      if (!medicamento) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Medicamento não encontrado',
        });
      }

      /*
       * Os registros de doses também são apagados
       * somente para esse usuário/medicamento.
       */
      await RegistroDoseModel.excluirPorMedicamento(
        req.params.id,
        req.usuarioId
      );

      const excluido =
        await MedicamentoModel.excluir(
          req.params.id,
          req.usuarioId
        );

      if (!excluido) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Medicamento não encontrado',
        });
      }

      return res.json({
        sucesso: true,
        mensagem: 'Medicamento excluído',
      });
    } catch (erro) {
      next(erro);
    }
  },

  async alternarAtivo(req, res, next) {
    try {
      const medicamento =
        await MedicamentoModel.buscarUm(
          req.params.id,
          req.usuarioId
        );

      if (!medicamento) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Medicamento não encontrado',
        });
      }

      const atualizado =
        await MedicamentoModel.atualizar(
          req.params.id,
          req.usuarioId,
          {
            ativo: !medicamento.ativo,
          }
        );

      return res.json({
        sucesso: true,
        mensagem: atualizado.ativo
          ? 'Medicamento ativado'
          : 'Medicamento desativado',
        dados: atualizado,
      });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = MedicamentoController;