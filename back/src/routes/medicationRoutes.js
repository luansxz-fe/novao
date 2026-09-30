const router = require('express').Router();

const { body } = require('express-validator');

const ctrl = require('../controllers/MedicationController.js');
const autenticar = require('../middleware/auth.js');
const validar = require('../middleware/validate.js');

router.use(autenticar);

const validacoesMedicamento = [
  body('nome')
    .trim()
    .notEmpty()
    .withMessage(
      'Nome do medicamento é obrigatório'
    ),

  body('dosagem')
    .trim()
    .notEmpty()
    .withMessage(
      'Dosagem é obrigatória'
    ),

  body('unidade')
    .trim()
    .notEmpty()
    .withMessage(
      'Unidade é obrigatória'
    ),

  body('frequencia')
    .trim()
    .notEmpty()
    .withMessage(
      'Frequência é obrigatória'
    ),

  body('horarios')
    .isArray({ min: 1 })
    .withMessage(
      'Informe ao menos um horário'
    ),

  body('horarios.*')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage(
      'Horário inválido, use HH:MM'
    ),

  body('dataInicio')
    .isDate()
    .withMessage(
      'Data de início inválida'
    ),

  body('cor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Cor inválida'),

  body('estoqueAtual')
    .optional()
    .isInt({ min: 0 })
    .withMessage(
      'Estoque inválido'
    ),

  body('estoqueMaximo')
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      'Capacidade inválida'
    ),

  body('urlImagem')
    .optional({
      nullable: true,
    })
    .custom((val) => {
      if (!val || val === '') {
        return true;
      }

      try {
        new URL(val);
        return true;
      } catch {
        throw new Error(
          'URL da imagem inválida'
        );
      }
    }),
];

router.get(
  '/',
  ctrl.listar
);

router.get(
  '/:id',
  ctrl.buscar
);

router.post(
  '/',
  validacoesMedicamento,
  validar,
  ctrl.criar
);

router.put(
  '/:id',
  validacoesMedicamento,
  validar,
  ctrl.atualizar
);

router.delete(
  '/:id',
  ctrl.excluir
);

router.patch(
  '/:id/alternar',
  ctrl.alternarAtivo
);

module.exports = router;