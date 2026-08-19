const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    // Set DB_ENCRYPT=true for Azure SQL / any TLS-enforcing server; DB_TRUST_CERT=true only for self-signed certs.
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false'
  }
};

let poolPromise = null;

async function connectDB() {
  if (poolPromise) return poolPromise;
  
  try {
    const pool = await sql.connect(config);
    console.log('Connected to SQL Server');
    
    // Auto-create tables if they don't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT GETDATE()
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='schemas' AND xtype='U')
      CREATE TABLE schemas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
        sheet_name VARCHAR(255) NOT NULL,
        columns_json NVARCHAR(MAX) NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT UC_UserSheet UNIQUE (user_id, sheet_name)
      );
    `);
    
    console.log('Database tables verified.');
    poolPromise = pool;
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
}

function getPool() {
  if (!poolPromise) {
    throw new Error('Database is not connected yet.');
  }
  return poolPromise;
}

module.exports = {
  connectDB,
  getPool,
  sql
};
