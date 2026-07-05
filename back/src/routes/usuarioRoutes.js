const router = require('express').Router();
const ctrl = require('../controllers/UsuarioController');
const autenticar = require('../middleware/auth');

router.use(autenticar);

router.get('/', ctrl.listarTodos);
router.get('/:id', ctrl.buscarPorId);

module.exports = router;
