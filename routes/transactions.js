const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');

const router = express.Router();


router.post('/', [
  body('type').isString().notEmpty(),
  body('category').isString().notEmpty(),
  body('amount').isFloat({ gt: 0 }),
  body('date').isISO8601(),
  body('description').optional().isString(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { type, category, amount, date, description } = req.body;
  db.run('INSERT INTO transactions (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)',
    [type, category, amount, date, description],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, type, category, amount, date, description });
    });
});


router.get('/', (req, res) => {
  db.all('SELECT * FROM transactions', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});


router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(row);
  });
});


router.put('/:id', [
  body('type').optional().isString(),
  body('category').optional().isString(),
  body('amount').optional().isFloat({ gt: 0 }),
  body('date').optional().isISO8601(),
  body('description').optional().isString(),
], (req, res) => {
  const { id } = req.params;
  const { type, category, amount, date, description } = req.body;
  
  db.run(`UPDATE transactions SET 
    type = COALESCE(?, type), 
    category = COALESCE(?, category), 
    amount = COALESCE(?, amount), 
    date = COALESCE(?, date), 
    description = COALESCE(?, description) 
    WHERE id = ?`,
    [type, category, amount, date, description, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ message: 'Transaction updated' });
    });
});


router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM transactions WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted' });
  });
});

router.get('/summary', (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = startDate && endDate ? `WHERE date BETWEEN ? AND ?` : '';

  db.get(`SELECT 
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
    SUM(amount) AS balance
    FROM transactions ${dateFilter}`, [startDate, endDate], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});

module.exports = router;