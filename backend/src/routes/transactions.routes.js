const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { getTransactions, createTransaction, deleteTransaction } = require('../controllers/transactions.controller');

// Todos los endpoints de transacciones requieren JWT
router.use(authMiddleware);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;