/**
 * Executa os scripts SQL da pasta /database.
 *
 *   npm run db:init   -> cria banco e tabelas (01_schema.sql)
 *   npm run db:seed   -> insere dados iniciais (02_seed.sql)
 *   npm run db:reset  -> DROPA o banco e recria tudo (00 + 01 + 02)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const SQL_DIR = path.join(__dirname, '..', 'database');

const COMMANDS = {
  init: ['01_schema.sql'],
  seed: ['02_seed.sql'],
  reset: ['00_drop.sql', '01_schema.sql', '02_seed.sql'],
};

async function main() {
  const command = process.argv[2];
  const files = COMMANDS[command];

  if (!files) {
    console.error(`Uso: node scripts/db.js <${Object.keys(COMMANDS).join('|')}>`);
    process.exit(1);
  }

  // Conecta sem selecionar database: os próprios scripts fazem CREATE/USE.
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(SQL_DIR, file), 'utf8');
      process.stdout.write(`> Executando ${file}... `);
      await conn.query(sql);
      console.log('ok');
    }
    console.log(`Comando "${command}" concluído.`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('\nErro ao executar script do banco:', err.message);
  process.exit(1);
});
