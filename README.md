# Indi Algo Lab

A comprehensive algorithmic trading platform for Indian markets with machine learning capabilities.

## 🚀 Quick Start

- **Status**: 🟢 Backend running on port 3001
- **Testing**: ✅ All 5 API tests passing
- **Documentation**: 📚 Organized in `/docs` folder
- **Ready for**: Phase 1 implementation (Database setup)

For detailed information, see [`docs/README.md`](docs/README.md)

## Features

- **Real-time Market Data**: Live quotes from Yahoo Finance
- **Multi-Vendor Architecture**: Automatic fallback chains
- **Algorithmic Trading**: Multiple trading strategies with backtesting
- **Machine Learning**: TensorFlow.js models for price prediction
- **Portfolio Management**: Track positions and performance
- **Technical Analysis**: Chart patterns and indicators
- **User Authentication**: Secure user management

## Tech Stack

- **Frontend**: React + TypeScript + Vite + ShadCN/UI + Tailwind CSS
- **Backend**: Node.js + Express + JWT Authentication
- **ML**: TensorFlow.js for client-side predictions
- **Data**: Yahoo Finance API for market data
- **Architecture**: Multi-vendor router with fallback logic

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm start
```

The backend will run on `http://localhost:3001`

### Frontend Setup

```bash
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📚 Documentation

All documentation has been organized in the `/docs` folder:

- **[docs/SESSION_SUMMARY.md](docs/SESSION_SUMMARY.md)** - Complete overview of recent work
- **[docs/COMPREHENSIVE_IMPROVEMENT_ROADMAP.md](docs/COMPREHENSIVE_IMPROVEMENT_ROADMAP.md)** - 4-phase implementation plan (5-6 weeks)
- **[docs/QUICK_IMPROVEMENTS_REFERENCE.md](docs/QUICK_IMPROVEMENTS_REFERENCE.md)** - Code templates for all 47+ improvements
- **[docs/TESTING_RESULTS.md](docs/TESTING_RESULTS.md)** - API test results (all 5 tests ✅)
- **[docs/README.md](docs/README.md)** - Full documentation index and navigation

See [docs/README.md](docs/README.md) for complete documentation structure.

## API Documentation

### Market Data (Multi-Vendor Router)
- `GET /api/market/quote/:symbol` - Get current quote
- `POST /api/market/quotes` - Get multiple quotes  
- `GET /api/market/historical/:symbol` - Get historical data
- `GET /api/market/options/:symbol` - Get options chain
- `GET /api/market/stats` - Get vendor health metrics

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### User Data
- `GET /api/user/portfolio` - Get user portfolio
- `POST /api/user/portfolio` - Update portfolio
- `GET /api/user/trades` - Get user trades
- `POST /api/user/trades` - Add new trade

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## Project Structure

```
├── backend/                 # Backend API
│   ├── routes/             # API routes
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── src/
│   ├── components/        # React components
│   ├── lib/              # Utilities and services
│   ├── contexts/         # React contexts
│   └── pages/            # Page components
├── public/               # Static assets
└── package.json         # Frontend dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
