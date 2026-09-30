const mongoose = require('mongoose');
require('dotenv').config();

async function conectarBanco() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('Erro: A variável MONGODB_URI não foi definida no arquivo .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conexão com o MongoDB estabelecida com sucesso!');
  } catch (erro) {
    console.error('Erro ao conectar no MongoDB:', erro.message);
    process.exit(1);
  }
}

module.exports = conectarBanco;