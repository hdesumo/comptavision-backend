const express = require('express');
const router = express.Router();

// GET /api/v1/tenants
router.get('/', (req, res) => {
  res.json({ items: [], message: 'Tenants route stub' });
});

module.exports = router;
