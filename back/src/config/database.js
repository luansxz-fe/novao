const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'medsync',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
});

pool.getConnection()
  .then(conexao => {
    console.log('Conexão com MySQL estabelecida');
    conexao.release();
  })
  .catch(erro => {
    console.error('Erro ao conectar no MySQL:', erro.message);
    process.exit(1);
  });

module.exports = pool;
