const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'fintrack_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS savings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    target_amount DECIMAL(10,2) DEFAULT NULL,
    target_date DATE DEFAULT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_savings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

// Inicializar base de datos y aplicar AUTO_INCREMENT a las llaves primarias si faltan
async function initializeDatabase() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ Conectado a MySQL (Railway/Local)');

    // Crear tabla de ahorros si no existe
    await conn.query(createTableQuery);
    console.log('✅ Tabla "savings" verificada/creada exitosamente.');

    // Aplicar AUTO_INCREMENT si el usuario creó las tablas sin esta propiedad
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
    await conn.query('ALTER TABLE users MODIFY id INT AUTO_INCREMENT;');
    await conn.query('ALTER TABLE transactions MODIFY id INT AUTO_INCREMENT;');
    await conn.query('ALTER TABLE savings MODIFY id INT AUTO_INCREMENT;');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ Columnas ID configuradas con AUTO_INCREMENT en Railway.');
  } catch (err) {
    console.error('❌ Error al inicializar la base de datos o configurar AUTO_INCREMENT:', err.message);
    if (conn) {
      try { await conn.query('SET FOREIGN_KEY_CHECKS = 1;'); } catch (e) {}
    }
  } finally {
    if (conn) conn.release();
  }
}

// Ejecutar inicialización al cargar el módulo
initializeDatabase();

module.exports = pool;