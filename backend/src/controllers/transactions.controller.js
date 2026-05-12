const db = require('../config/db');

// GET /api/transactions
const getTransactions = async (req, res) => {
  const userId = req.user.id;

  try {
    const [transactions] = await db.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC',
      [userId]
    );

    // Calcular saldo en el backend
    const balance = transactions.reduce((acc, t) => {
      return t.type === 'INCOME'
        ? acc + parseFloat(t.amount)
        : acc - parseFloat(t.amount);
    }, 0);

    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);

    res.json({
      balance: parseFloat(balance.toFixed(2)),
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      transactions
    });
  } catch (err) {
    console.error('Error en getTransactions:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// POST /api/transactions
const createTransaction = async (req, res) => {
  const userId = req.user.id;
  const { amount, type, category, description, date } = req.body;

  if (!amount || !type || !category || !date) {
    return res.status(400).json({ message: 'amount, type, category y date son requeridos.' });
  }

  if (!['INCOME', 'EXPENSE'].includes(type)) {
    return res.status(400).json({ message: 'type debe ser INCOME o EXPENSE.' });
  }

  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'El monto debe ser mayor a 0.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO transactions (user_id, amount, type, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, Math.abs(parseFloat(amount)), type, category, description || '', date]
    );

    const [rows] = await db.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Transacción registrada.',
      transaction: rows[0]
    });
  } catch (err) {
    console.error('Error en createTransaction:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Transacción no encontrada o no tienes permiso.' });
    }

    await db.query('DELETE FROM transactions WHERE id = ?', [id]);

    res.json({ message: 'Transacción eliminada.' });
  } catch (err) {
    console.error('Error en deleteTransaction:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getTransactions, createTransaction, deleteTransaction };