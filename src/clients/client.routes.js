const express = require('express');
const router = express.Router();

// GET /api/v1/clients
router.get('/', (req, res) => {
  res.json({ items: [], message: 'Clients route stub' });
});

module.exports = router;
