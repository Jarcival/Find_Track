const mysql2 = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const pool = mysql2.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fintrack_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verificar conexión al iniciar y crear tabla savings si no existe
pool.getConnection()
  .then(async (conn) => {
    console.log('✅ Conectado a MySQL (XAMPP)');
    
    // Crear tabla de ahorros si no existe
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
    
    try {
      await conn.query(createTableQuery);
      console.log('✅ Tabla "savings" verificada/creada exitosamente.');
    } catch (tableErr) {
      console.error('❌ Error al crear la tabla "savings":', tableErr.message);
    }
    
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar con MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;