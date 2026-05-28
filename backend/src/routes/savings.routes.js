const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  getSavings,
  toggleSavings,
  updateTarget,
  depositSavings,
  withdrawSavings
} = require('../controllers/savings.controller');

// Todos los endpoints de ahorros requieren JWT
router.use(authMiddleware);

router.get('/', getSavings);
router.post('/toggle', toggleSavings);
router.post('/target', updateTarget);
router.post('/deposit', depositSavings);
router.post('/withdraw', withdrawSavings);

module.exports = router;
