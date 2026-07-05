const MedicamentoModel = require('../models/MedicationModel');
const RegistroDoseModel = require('../models/LogModel');

const MedicamentoController = {

  async listar(req, res, next) {
    try {
      const medicamentos = await MedicamentoModel.listarPorUsuario(req.usuario.id);
      return res.json({ sucesso: true, dados: medicamentos });
    } catch (erro) { next(erro); }
  },

  async buscar(req, res, next) {
    try {
      const medicamento = await MedicamentoModel.buscarUm(req.params.id, req.usuario.id);
      if (!medicamento) return res.status(404).json({ sucesso: false, mensagem: 'Medicamento nao encontrado' });
      return res.json({ sucesso: true, dados: medicamento });
    } catch (erro) { next(erro); }
  },

  async criar(req, res, next) {
    try {
      const medicamento = await MedicamentoModel.criar(req.usuario.id, req.body);
      return res.status(201).json({ sucesso: true, mensagem: 'Medicamento criado', dados: medicamento });
    } catch (erro) { next(erro); }
  },

  async atualizar(req, res, next) {
    try {
      const existe = await MedicamentoModel.buscarUm(req.params.id, req.usuario.id);
      if (!existe) return res.status(404).json({ sucesso: false, mensagem: 'Medicamento nao encontrado' });
      const medicamento = await MedicamentoModel.atualizar(req.params.id, req.usuario.id, req.body);
      return res.json({ sucesso: true, mensagem: 'Medicamento atualizado', dados: medicamento });
    } catch (erro) { next(erro); }
  },

  async excluir(req, res, next) {
    try {
      await RegistroDoseModel.excluirPorMedicamento(req.params.id, req.usuario.id);
      const excluido = await MedicamentoModel.excluir(req.params.id, req.usuario.id);
      if (!excluido) return res.status(404).json({ sucesso: false, mensagem: 'Medicamento nao encontrado' });
      return res.json({ sucesso: true, mensagem: 'Medicamento excluido' });
    } catch (erro) { next(erro); }
  },

  async alternarAtivo(req, res, next) {
    try {
      const medicamento = await MedicamentoModel.buscarUm(req.params.id, req.usuario.id);
      if (!medicamento) return res.status(404).json({ sucesso: false, mensagem: 'Medicamento nao encontrado' });
      const atualizado = await MedicamentoModel.atualizar(req.params.id, req.usuario.id, { ativo: !medicamento.ativo });
      return res.json({ sucesso: true, mensagem: atualizado.ativo ? 'Medicamento ativado' : 'Medicamento desativado', dados: atualizado });
    } catch (erro) { next(erro); }
  },
};

module.exports = MedicamentoController;
