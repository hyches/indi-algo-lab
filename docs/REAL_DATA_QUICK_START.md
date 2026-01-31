# Real Data Implementation - Quick Setup Guide

## What Changed?

✅ **Options Chain** - Now fetches REAL option strike data from Yahoo Finance  
✅ **Portfolio Heatmap** - Shows YOUR actual positions instead of mock data  
✅ **Trade Panel** - Uses real strikes from available options  
✅ **Market Quotes** - Real-time data every ~5 seconds  
✅ **Zero Hardcoded Values** - No more mock strikes like 24900  

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

This installs `yahoo-finance2` which provides access to real options data.

### 2. Start Both Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
```
(Runs on http://localhost:5173)

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```
(Runs on http://localhost:3001)

### 3. Test Real Data Flow

1. **Open the app** at http://localhost:5173
2. **Go to Watchlist** → Verify quotes update every ~5 seconds
3. **Select a symbol with options** (NIFTY, BANKNIFTY, etc.)
4. **Click Options tab** → Wait for real strikes to load
5. **Select a strike** → Verify real option prices
6. **Execute a trade** → Position appears in heatmap

## Key Points

### Options Now Show Real Data
- Real expiry dates (instead of hardcoded)
- Real strikes from actual market
- Real IV, OI, bid/ask prices
- Graceful handling if options unavailable

### Portfolio Heatmap Shows Your Trades
- Create a trade first → Heatmap populates
- Shows real P&L % for each position
- Updates automatically as prices change
- Empty if no positions (intentional!)

### Zero Mock Data in Core Flows
- ✅ Market quotes - REAL (Yahoo Finance)
- ✅ Options chain - REAL (Yahoo Finance)  
- ✅ Portfolio positions - REAL (Your trades)
- ✅ P&L calculations - REAL (Based on market prices)

## Troubleshooting

### "No Option Data Available"
This usually means:
- Symbol doesn't have options (try NIFTY or BANKNIFTY)
- Backend not running (check terminal 2)
- Internet connectivity issue

### PortfolioHeatmap Empty
This is **normal**! Heatmap shows your actual trades:
1. Execute a trade first (TradePanel)
2. Heatmap auto-updates with your position
3. Select "Positions" tab to see all open trades

### Backend Errors
Check `backend/routes/market.js` logs:
```bash
# Terminal 2 should show:
# "Fetched quote for NIFTY"
# "Fetched options chain for NIFTY expiry 2025-02-06"
```

## Documentation

See detailed migration guide: [MOCK_TO_REAL_DATA_MIGRATION.md](MOCK_TO_REAL_DATA_MIGRATION.md)

Key updated files:
- `backend/routes/market.js` - Real options endpoint
- `src/components/dashboard/OptionChain.tsx` - Fetches real data
- `src/components/dashboard/PortfolioHeatmap.tsx` - Shows real positions
- `.github/copilot-instructions.md` - Updated architecture docs

## What's Still Using Mock Data (Intentional)

These components use placeholder data because they need external APIs:
- **FII/DII flows** - Would need Moneycontrol or similar API
- **Market breadth** - Would need NSE data feed
- **News feed** - Would need news API
- **Risk metrics** - Simplified calculations (could use QuantLib)

All of these can be upgraded with appropriate data providers.

## Next Steps

1. ✅ Real options data working? Try trading!
2. ✅ Want real Greeks (Delta, Gamma)? Implement Black-Scholes  
3. ✅ Need persistent storage? Add MongoDB
4. ✅ Want FII/DII? Connect to Finnhub or Polygon.io
5. ✅ Real broker orders? Integrate Zerodha/Angel One API

---

**Questions?** Check `.github/copilot-instructions.md` for detailed architecture and data flow diagrams.
