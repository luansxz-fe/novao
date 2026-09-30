require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const conectarBanco =
  require('./config/database');

const rotasAuth =
  require('./routes/authRoutes.js');

const rotasUsuarios =
  require('./routes/usuarioRoutes.js');

const rotasMedicamentos =
  require('./routes/medicationRoutes.js');

const rotasRegistros =
  require('./routes/logRoutes.js');

const {
  tratarErro,
  rotaNaoEncontrada,
} =
  require('./middleware/errorHandler.js');

const app = express();

const PORTA =
  process.env.PORT || 3001;

/*
 * Banco
 */
conectarBanco();

/*
 * CORS
 *
 * Para começar, podemos aceitar qualquer origem.
 * Como o frontend usa Authorization Bearer
 * e não cookies, isso funciona.
 */
app.use(
  cors({
    origin: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  })
);

app.use(
  express.json({
    limit: '2mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/*
 * Rate limit geral
 */
const limitadorGeral =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 200,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      sucesso: false,
      mensagem:
        'Muitas requisições. Tente novamente em 15 minutos.',
    },
  });

app.use(
  '/api',
  limitadorGeral
);

/*
 * Rate limit de autenticação
 */
const limitadorAuth =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 20,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      sucesso: false,
      mensagem:
        'Muitas tentativas. Aguarde 15 minutos.',
    },
  });

app.use(
  '/api/auth',
  limitadorAuth
);

/*
 * Health check
 */
app.get(
  '/api/health',
  (req, res) => {
    res.json({
      sucesso: true,
      servico: 'MedSync API',
      versao: '1.0.0',
      horario:
        new Date().toISOString(),
      ambiente:
        process.env.NODE_ENV ||
        'development',
    });
  }
);

/*
 * Rotas
 */
app.use(
  '/api/auth',
  rotasAuth
);

app.use(
  '/api/usuarios',
  rotasUsuarios
);

app.use(
  '/api/medicamentos',
  rotasMedicamentos
);

app.use(
  '/api/registros',
  rotasRegistros
);

/*
 * Erros
 */
app.use(
  rotaNaoEncontrada
);

app.use(
  tratarErro
);

app.listen(
  PORTA,
  () => {
    console.log(
      `MedSync API rodando na porta ${PORTA}`
    );

    console.log(
      `Ambiente: ${
        process.env.NODE_ENV ||
        'development'
      }`
    );
  }
);

module.exports = app;