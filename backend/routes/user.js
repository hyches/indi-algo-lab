const express = require('express');
const router = express.Router();

// In-memory storage (replace with database in production)
const userPortfolios = new Map();
const userTrades = new Map();

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get user portfolio
router.get('/portfolio', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const portfolio = userPortfolios.get(userId) || {
    cash: 100000,
    positions: [],
    totalValue: 100000
  };

  res.json(portfolio);
});

// Update portfolio
router.post('/portfolio', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { cash, positions, totalValue } = req.body;

  const portfolio = {
    cash: cash || 100000,
    positions: positions || [],
    totalValue: totalValue || cash || 100000,
    updatedAt: new Date()
  };

  userPortfolios.set(userId, portfolio);
  res.json(portfolio);
});

// Get user trades
router.get('/trades', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const trades = userTrades.get(userId) || [];

  res.json(trades);
});

// Add trade
router.post('/trades', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const trade = {
    id: Date.now(),
    ...req.body,
    userId,
    timestamp: new Date()
  };

  const trades = userTrades.get(userId) || [];
  trades.push(trade);
  userTrades.set(userId, trades);

  res.json(trade);
});

// Get trade by ID
router.get('/trades/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const tradeId = parseInt(req.params.id);
  const trades = userTrades.get(userId) || [];
  const trade = trades.find(t => t.id === tradeId);

  if (!trade) {
    return res.status(404).json({ error: 'Trade not found' });
  }

  res.json(trade);
});

// Update trade
router.put('/trades/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const tradeId = parseInt(req.params.id);
  const trades = userTrades.get(userId) || [];
  const tradeIndex = trades.findIndex(t => t.id === tradeId);

  if (tradeIndex === -1) {
    return res.status(404).json({ error: 'Trade not found' });
  }

  trades[tradeIndex] = {
    ...trades[tradeIndex],
    ...req.body,
    updatedAt: new Date()
  };

  userTrades.set(userId, trades);
  res.json(trades[tradeIndex]);
});

// Delete trade
router.delete('/trades/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const tradeId = parseInt(req.params.id);
  const trades = userTrades.get(userId) || [];
  const filteredTrades = trades.filter(t => t.id !== tradeId);

  if (filteredTrades.length === trades.length) {
    return res.status(404).json({ error: 'Trade not found' });
  }

  userTrades.set(userId, filteredTrades);
  res.json({ message: 'Trade deleted' });
});

module.exports = router;