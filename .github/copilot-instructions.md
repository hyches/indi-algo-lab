<!-- Copilot / AI agent instructions for contributors -->
# Copilot instructions — Indi Algo Lab (DETAILED AUDIT)

Purpose
-------
This document is a deep-dive, discovery-first guide for AI coding agents and contributors who need to become productive quickly in this repository. It focuses on concrete, discoverable facts: architecture, what is implemented vs stubbed/mocked, data flows, important files, developer workflows, and step-by-step examples for common agent tasks.

Summary (one-liner)
--------------------
Frontend is a Vite + React + TypeScript SPA that simulates trading and ML client-side; backend is a lightweight Express API (yahoo-finance backed) used by the frontend for market data and simple user endpoints. Machine learning runs in-browser with TensorFlow.js and persists to localStorage.

Quick start (commands)
----------------------
- Install frontend deps and run dev server (project root):

```bash
npm install
npm run dev
```

- Backend (API server) — in `backend/`:

```bash
cd backend
npm install
npm run dev    # nodemon for dev
# or
npm start      # production mode
```

- Linting (root):

```bash
npm run lint
```

High-level architecture
------------------------
- Frontend (SPA)
  - Tech: React + TypeScript + Vite + Tailwind + ShadCN UI components.
  - Entry: [src/main.tsx](src/main.tsx#L1) -> [src/App.tsx](src/App.tsx#L1).
  - Routing: React Router in `App.tsx` with primary dashboard under `/`.
  - Global state & domain logic: `TradingContext` ([src/contexts/TradingContext.tsx](src/contexts/TradingContext.tsx#L1)) — central point for market data, positions, trades, portfolio calculations, and ML hooks.

- Backend (API)
  - Tech: Node.js + Express.
  - Entry: [backend/server.js](backend/server.js#L1).
  - Routes: `backend/routes/*`: `auth.js` (JWT + in-memory users), `market.js` (Yahoo finance wrappers), `user.js` (in-memory portfolios/trades).
  - Data persistence: in-memory maps/arrays for users/trades/portfolio — NOT production-ready.

- Machine Learning
  - Client-side TFJS models in [src/lib/ml/](src/lib/ml/) (model lifecycle in `model.ts`).
  - Feature extraction in `featureExtractor.ts` and model registry under `models/`.
  - Storage: models saved to `localstorage://trading-ml-model`; normalization metadata in `localStorage` keys described below.

Key data flows and integrations (detailed)
----------------------------------------
These are the most important interactions an AI agent needs to understand before changing or adding features.

1) Market data (real)
  - Path: Frontend `yahooFinance` service ([src/lib/marketData/yahooFinance.ts](src/lib/marketData/yahooFinance.ts#L1)) -> backend `/api/market` endpoints -> backend uses `yahoo-finance` npm package to fetch live data.
  - Polling: the frontend service starts an interval (`setInterval`) and calls `POST /api/market/quotes` every ~5s to update subscribed symbols.
  - Symbol canonicalization: `YAHOO_SYMBOL_MAP` inside `yahooFinance.ts` maps logical symbols (e.g., `RELIANCE`) to Yahoo tickers (`RELIANCE.NS`). Add new instruments there when exposing them.

2) Trading flow (simulated, client-side)
  - Trades are executed entirely in the frontend: `TradingContext.executeTrade()` simulates execution (immediate `EXECUTED` status), updates `trades` and `positions` state, and recalculates portfolio.
  - No server-side order execution endpoint exists by default. If you add server persistence, follow patterns in `backend/routes/user.js` and wire client calls into `executeTrade()` or provide a parallel server call.
  - Margin calculations, PnL, and average price logic live in `TradingContext` — avoid large structural changes there; prefer listener hooks (`addTradeListener`) to attach cross-cutting behavior (e.g., ML example collection).

3) ML flow (local-only by default)
  - Data collection: `TradingContext.addTradeListener()` is the canonical hook agents use to capture executed trades for ML labeling or incremental learning. Example uses: `src/components/dashboard/MLTrainingPanel.tsx` listens and aggregates examples.
  - Storage: training examples saved to localStorage under `trading-ml-examples`; normalization metadata under `trading-ml-normalization`; models saved by TFJS to `localstorage://trading-ml-model`.
  - Training/prediction: `src/lib/ml/model.ts` exposes `train`, `predict`, `addTrainingExample`, etc. `initialize()` attempts to load an existing saved model.

4) Auth & user data (in-memory)
  - `backend/routes/auth.js` implements registration/login/profile using JWT but stores users in an in-memory array.
  - `backend/routes/user.js` provides portfolio and trades endpoints but stores data in-memory maps. These are useful for demo/backoffice flows but must be replaced with a DB for persistence.

Real vs Mock / Production-readiness (UPDATED)
----------------------------------
- Real / network-backed
  - Market quotes/historical data: backend uses `yahoo-finance2` npm package and returns live data to the frontend.
  - Options chain: NOW FULLY IMPLEMENTED with real yahoo-finance options data fetching. Backend endpoint `GET /api/market/options/:symbol?expiry=DATE` returns real strikes, IV, OI, bid/ask prices.
  - Frontend subscribes and polls the backend — this is a real data path assuming the backend can reach Yahoo Finance.

- In-memory only (demo/paper trading purposes)
  - User storage: `auth.js` and `user.js` use in-memory arrays/maps — data resets when server restarts.
  - Trading execution: executed locally in `TradingContext` (optimistic simulation) — no server-side order confirmations or fills.
  - ML storage & training: all client-side in localStorage — no server offload or scheduled retraining.

- Removed / No longer mocked
  - Portfolio heatmap now uses REAL positions from `TradingContext` instead of hardcoded mock data.
  - OptionChain component now fetches and displays REAL options data from the backend.
  - All hardcoded option strikes (24900, etc.) removed from defaults.
  - No mock sector data, FII/DII, or market breadth data in ResearchDashboard (users see real data when positions exist).

Consequences / guidance
  - The application now shows REAL market data for all supported symbols via Yahoo Finance.
  - Options chain is real — users select actual available strikes and expirations.
  - Portfolio heatmap updates based on user's actual positions — empty if no positions exist.
  - For demo purposes: create a trade to populate the portfolio and options will display dynamically.

Important files (quick reference)
--------------------------------
- Frontend entry: [src/main.tsx](src/main.tsx#L1)
- App wiring: [src/App.tsx](src/App.tsx#L1)
- Trading state & domain: [src/contexts/TradingContext.tsx](src/contexts/TradingContext.tsx#L1)
- Market adapter (frontend): [src/lib/marketData/yahooFinance.ts](src/lib/marketData/yahooFinance.ts#L1)
- ML model: [src/lib/ml/model.ts](src/lib/ml/model.ts#L1)
- ML feature extraction: [src/lib/ml/featureExtractor.ts](src/lib/ml/featureExtractor.ts#L1)
- Backend entry: [backend/server.js](backend/server.js#L1)
- Backend market routes: [backend/routes/market.js](backend/routes/market.js#L1)
- Backend auth: [backend/routes/auth.js](backend/routes/auth.js#L1)
- Backend user: [backend/routes/user.js](backend/routes/user.js#L1)
- UI primitives: `src/components/ui/*` (ShadCN/Tailwind pattern)

Project-specific conventions and patterns
---------------------------------------
- Path alias: `@/` maps to `src/` (see `tsconfig.json`); use this consistently for imports.
- Storage keys (client-side):
  - `trading-ml-model` — TFJS save key (localstorage://)
  - `trading-ml-normalization` — feature means/stds JSON
  - `trading-ml-examples` — incremental training dataset in localStorage
- UI: components under `src/components/ui/` are small primitives; follow their structure when adding new UI pieces.
- Theme: `ThemeProvider` persists under a storage key (App passes `paper-trading-theme`), and toggles `light`/`dark` classes on `document.documentElement`.
- Trade listeners: use `addTradeListener` in `TradingContext` rather than touching internal arrays directly — returns a cleanup function.

Developer workflows & debugging (practical)
-----------------------------------------
1) Start frontend + backend together

```bash
# Terminal A (root)
npm run dev

# Terminal B (backend)
cd backend
npm run dev
```

Frontend expects backend at `http://localhost:3001/api` by default; change `FRONTEND_URL` in `backend/.env` for CORS or modify `src/lib/marketData/yahooFinance.ts`'s `API_BASE` for testing remote backends.

2) Backend environment
  - Copy `.env.example` to `.env` in `backend/` and set `PORT`, `JWT_SECRET`, `FRONTEND_URL`.

3) Debugging tips
  - Backend: `npm run dev` uses `nodemon`; attach `node --inspect server.js` for inspector.
  - Frontend: Vite HMR logs appear in the browser console. Use React DevTools to inspect `TradingContext` state.
  - Network: verify `/api/market/quote/:symbol` and `/api/market/quotes` responses via curl or browser.

4) Manual verification checklist after changes
  - Start both servers and open the UI at `http://localhost:5173`.
  - Verify watchlist and quote updates (should refresh every ~5s).
  - Execute a trade from `TradePanel` and verify: `trades` list updates; `positions` update; toasts appear.
  - Check localStorage keys appear after training/prediction flows.

Step-by-step examples and common agent tasks
-------------------------------------------
Below are concrete, copy/paste-ready examples for common modifications an AI agent will be asked to implement.

1) Add a new market symbol

Files to edit:
- `src/lib/marketData/yahooFinance.ts` — update `YAHOO_SYMBOL_MAP` and `getAvailableSymbols()`.

Example patch (conceptual):

```diff
@@
 const YAHOO_SYMBOL_MAP: Record<string, string> = {
   'NIFTY': '^NSEI',
   // ...
+  'ADANIENT': 'ADANIENT.NS',
 };

@@
   getAvailableSymbols(): string[] {
-    return ['NIFTY','BANKNIFTY',...];
+    return ['NIFTY','BANKNIFTY','ADANIENT',...];
   }
```

Notes:
  - Use the Yahoo suffix `.NS` for NSE stocks; for indices use Yahoo tickers like `^NSEI`.
  - After adding the symbol, the frontend subscription will start fetching quotes for it via `/api/market/quotes`.

2) Hook ML `predict` into a dashboard component

Files to inspect/use:
- `src/lib/ml/model.ts` (exported `tradingModel`)
- `src/contexts/TradingContext.tsx` (for features / current symbol)
- UI location where you want to surface the prediction (e.g., `src/components/dashboard/AdvancedMLPanel.tsx`).

Example (pseudo):

```ts
import { tradingModel } from '@/lib/ml/model';

// ensure model initialized somewhere (e.g., on mount)
await tradingModel.initialize();
const features = extractFeaturesForSymbol(symbol); // use featureExtractor
const result = await tradingModel.predict(features);
// render `result.signal` and `result.confidence`
```

3) Add server-side trade persistence (end-to-end)

Goal: When a trade executes in `TradingContext`, POST to `POST /api/user/trades` so the backend stores it.

High-level steps:
  - Add optional network call inside `executeTrade()` in `src/contexts/TradingContext.tsx` to POST the trade when user is logged in (bearer token).
  - Ensure backend `backend/routes/user.js` already supports `POST /trades` (it does, in-memory). If you want persistence, replace in-memory maps with DB operations.

Minimal client change (conceptual):

```diff
@@
     // Notify listeners (for ML training)
     tradeListeners.forEach(listener => listener(trade));

+    // Optional: persist trade to server when token present
+    try {
+      const token = localStorage.getItem('auth_token');
+      if (token) {
+        await fetch('/api/user/trades', {
+          method: 'POST',
+          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
+          body: JSON.stringify(trade)
+        });
+      }
+    } catch (err) {
+      console.warn('Unable to persist trade to server', err);
+    }
