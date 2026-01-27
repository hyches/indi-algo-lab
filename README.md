# Indi Algo Lab

A comprehensive algorithmic trading platform for Indian markets with machine learning capabilities.

## Features

- **Real-time Market Data**: Live quotes from Yahoo Finance
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

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Market Data
- `GET /api/market/historical/:symbol` - Get historical data
- `GET /api/market/quote/:symbol` - Get current quote
- `POST /api/market/quotes` - Get multiple quotes

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
