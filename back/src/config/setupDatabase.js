require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const caminhoSchemaExterno = path.join(__dirname, '../../../medsync-database/migrations/001_schema.sql');
const caminhoSchemaLocal = path.join(__dirname, '../../sql/schema.sql');

async function configurar() {
  console.log('MedSync - configuração do banco de dados');

  const conexao = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    const arquivoSchema = fs.existsSync(caminhoSchemaExterno) ? caminhoSchemaExterno : caminhoSchemaLocal;
    const sql = fs.readFileSync(arquivoSchema, 'utf8');

    console.log('Criando banco e tabelas');
    await conexao.query(sql);
    console.log('Banco medsync criado');
    console.log('Tabela usuarios criada');
    console.log('Tabela tokens_recuperacao_senha criada');
    console.log('Tabela medicamentos criada');
    console.log('Tabela registros_doses criada');
    console.log('Configure o .env, instale as dependências e execute npm run dev');
  } catch (erro) {
    console.error('Erro:', erro.message);
    if (erro.code === 'ENOENT') console.error('Schema não encontrado, execute a partir da pasta medsync-backend');
    process.exit(1);
  } finally {
    await conexao.end();
  }
}

configurar();
