const db = require('../config/db');

// GET /api/savings
const getSavings = async (req, res) => {
  const userId = req.user.id;

  try {
    // Buscar si ya tiene registro de ahorros
    const [rows] = await db.query('SELECT * FROM savings WHERE user_id = ?', [userId]);
    
    if (rows.length === 0) {
      // Si no existe, crear uno por defecto
      await db.query('INSERT INTO savings (user_id, created_at) VALUES (?, NOW())', [userId]);
      const [newRows] = await db.query('SELECT * FROM savings WHERE user_id = ?', [userId]);
      return res.json(newRows[0]);
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en getSavings:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// POST /api/savings/toggle
const toggleSavings = async (req, res) => {
  const userId = req.user.id;
  const { active } = req.body;

  if (active === undefined) {
    return res.status(400).json({ message: 'El campo active es requerido.' });
  }

  try {
    await db.query('UPDATE savings SET active = ? WHERE user_id = ?', [!!active, userId]);
    const [rows] = await db.query('SELECT * FROM savings WHERE user_id = ?', [userId]);
    res.json({ message: active ? 'Cajita activada.' : 'Cajita desactivada.', savings: rows[0] });
  } catch (err) {
    console.error('Error en toggleSavings:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// POST /api/savings/target
const updateTarget = async (req, res) => {
  const userId = req.user.id;
  const { target_amount, target_date } = req.body;

  try {
    await db.query(
      'UPDATE savings SET target_amount = ?, target_date = ? WHERE user_id = ?',
      [target_amount ? parseFloat(target_amount) : null, target_date || null, userId]
    );
    const [rows] = await db.query('SELECT * FROM savings WHERE user_id = ?', [userId]);
    res.json({ message: 'Meta de ahorro actualizada.', savings: rows[0] });
  } catch (err) {
    console.error('Error en updateTarget:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// POST /api/savings/deposit
const depositSavings = async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'El monto debe ser mayor a 0.' });
  }

  const depositAmount = parseFloat(amount);

  try {
    // 1. Obtener saldo disponible actual del usuario
    const [transactions] = await db.query(
      'SELECT type, amount FROM transactions WHERE user_id = ?',
      [userId]
    );

    const availableBalance = transactions.reduce((acc, t) => {
      return t.type === 'INCOME'
        ? acc + parseFloat(t.amount)
        : acc - parseFloat(t.amount);
    }, 0);

    if (availableBalance < depositAmount) {
      return res.status(400).json({ message: 'Saldo disponible insuficiente para transferir a la cajita.' });
    }

    // 2. Realizar la transferencia
    // Insertar transacción de tipo EXPENSE (gasto) en la categoría Ahorro
    const today = new Date().toISOString().split('T')[0];
    await db.query(
      'INSERT INTO transactions (user_id, amount, type, category, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [userId, depositAmount, 'EXPENSE', 'Ahorro', 'Depósito a Cajita Nu', today]
    );

    // Incrementar saldo de la cajita
    await db.query(
      'UPDATE savings SET balance = balance + ? WHERE user_id = ?',
      [depositAmount, userId]
    );

    const [rows] = await db.query('SELECT * FROM savings WHERE user_id = ?', [userId]);
    res.json({
      message: 'Monto transferido a la cajita con éxito.',
      savings: rows[0]
    });
  } catch (err) {
    console.error('Error en depositSavings:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// POST /api/savings/withdraw
const withdrawSavings = async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'El monto debe ser mayor a 0.' });
  }

  const withdrawAmount = parseFloat(amount);

  try {
    // 1. Obtener saldo de la cajita
    const [rows] = await db.query('SELECT balance FROM savings WHERE user_id = ?', [userId]);
    if (rows.length === 0 || parseFloat(rows[0].balance) < withdrawAmount) {
      return res.status(400).json({ message: 'Saldo de cajita insuficiente.' });
    }

    // 2. Realizar la transferencia de regreso
    // Insertar transacción de tipo INCOME (ingreso) en la categoría Ahorro
    const today = new Date().toISOString().split('T')[0];
    await db.query(
      'INSERT INTO transactions (user_id, amount, type, category, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [userId, withdrawAmount, 'INCOME', 'Ahorro', 'Retiro de Cajita Nu', today]
    );

    // Decrementar saldo de la cajita
    await db.query(
      'UPDATE savings SET balance = balance - ? WHERE user_id = ?',
      [withdrawAmount, userId]
    );

    const [newRows] = await db.query('SELECT * FROM savings WHERE user_id = ?', [userId]);
    res.json({
      message: 'Monto retirado de la cajita con éxito.',
      savings: newRows[0]
    });
  } catch (err) {
    console.error('Error en withdrawSavings:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  getSavings,
  toggleSavings,
  updateTarget,
  depositSavings,
  withdrawSavings
};
