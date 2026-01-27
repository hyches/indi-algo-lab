const express = require('express');
const yahooFinance = require('yahoo-finance');
const router = express.Router();

// Get historical data
router.get('/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1y', interval = '1d' } = req.query;

    // Convert period to from/to dates
    const to = new Date();
    const from = new Date();

    switch(period) {
      case '1d': from.setDate(from.getDate() - 1); break;
      case '5d': from.setDate(from.getDate() - 5); break;
      case '1mo': from.setMonth(from.getMonth() - 1); break;
      case '3mo': from.setMonth(from.getMonth() - 3); break;
      case '6mo': from.setMonth(from.getMonth() - 6); break;
      case '1y': from.setFullYear(from.getFullYear() - 1); break;
      case '2y': from.setFullYear(from.getFullYear() - 2); break;
      case '5y': from.setFullYear(from.getFullYear() - 5); break;
      case '10y': from.setFullYear(from.getFullYear() - 10); break;
      case 'ytd': from.setMonth(0, 1); break;
      case 'max': from.setFullYear(1900); break;
      default: from.setFullYear(from.getFullYear() - 1);
    }

    const data = await yahooFinance.historical({
      symbol: symbol,
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
      period: interval
    });

    // Transform data to match frontend expectations
    const transformedData = data.map(item => ({
      timestamp: new Date(item.date),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));

    res.json(transformedData);
  } catch (error) {
    console.error('Historical data error:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Get current quote
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    const quote = await yahooFinance.quote({
      symbol: symbol,
      modules: ['price', 'summaryDetail']
    });

    res.json({
      symbol: quote.price.symbol,
      shortName: quote.price.shortName,
      regularMarketPrice: quote.price.regularMarketPrice,
      regularMarketChange: quote.price.regularMarketChange,
      regularMarketChangePercent: quote.price.regularMarketChangePercent,
      regularMarketOpen: quote.price.regularMarketOpen,
      regularMarketDayHigh: quote.price.regularMarketDayHigh,
      regularMarketDayLow: quote.price.regularMarketDayLow,
      regularMarketVolume: quote.price.regularMarketVolume,
      regularMarketPreviousClose: quote.price.regularMarketPreviousClose,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Get multiple quotes
router.post('/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!Array.isArray(symbols)) {
      return res.status(400).json({ error: 'Symbols must be an array' });
    }

    const quotes = await Promise.all(
      symbols.map(symbol => yahooFinance.quote({
        symbol: symbol,
        modules: ['price', 'summaryDetail']
      }))
    );

    const transformedQuotes = quotes.map(quote => ({
      symbol: quote.price.symbol,
      shortName: quote.price.shortName,
      regularMarketPrice: quote.price.regularMarketPrice,
      regularMarketChange: quote.price.regularMarketChange,
      regularMarketChangePercent: quote.price.regularMarketChangePercent,
      regularMarketOpen: quote.price.regularMarketOpen,
      regularMarketDayHigh: quote.price.regularMarketDayHigh,
      regularMarketDayLow: quote.price.regularMarketDayLow,
      regularMarketVolume: quote.price.regularMarketVolume,
      regularMarketPreviousClose: quote.price.regularMarketPreviousClose,
      timestamp: new Date()
    }));

    res.json(transformedQuotes);
  } catch (error) {
    console.error('Quotes error:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Get option chain data (simplified)
router.get('/options/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    // Get underlying price
    const quote = await yahooFinance.quote(symbol);
    const spotPrice = quote.regularMarketPrice;

    // For now, return basic structure - in production you'd use proper options API
    res.json({
      symbol,
      spotPrice,
      expiryDates: [],
      optionChain: []
    });
  } catch (error) {
    console.error('Options error:', error);
    res.status(500).json({ error: 'Failed to fetch options data' });
  }
});

module.exports = router;