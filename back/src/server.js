require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const rotasAuth = require('./routes/authRoutes');
const rotasUsuarios = require('./routes/usuarioRoutes');
const rotasMedicamentos = require('./routes/medicationRoutes');
const rotasRegistros = require('./routes/logRoutes');
const { tratarErro, rotaNaoEncontrada } = require('./middleware/errorHandler');

require('./config/database');

const app = express();
const PORTA = process.env.PORT || 3001;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const limitadorGeral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { sucesso: false, mensagem: 'Muitas requisicoes. Tente novamente em 15 minutos.' },
});
app.use('/api', limitadorGeral);

const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { sucesso: false, mensagem: 'Muitas tentativas. Aguarde 15 minutos.' },
});
app.use('/api/auth', limitadorAuth);

app.get('/api/health', (req, res) => {
  res.json({
    sucesso: true,
    servico: 'MedSync API',
    versao: '1.0.0',
    horario: new Date().toISOString(),
    ambiente: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth', rotasAuth);
app.use('/api/usuarios', rotasUsuarios);
app.use('/api/medicamentos', rotasMedicamentos);
app.use('/api/registros', rotasRegistros);

app.use(rotaNaoEncontrada);
app.use(tratarErro);

app.listen(PORTA, () => {
  console.log(`MedSync API rodando em http://localhost:${PORTA}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
