# Indi Algo Lab Backend

Backend API for the Indi Algo Lab trading application.

## Features

- **Authentication**: User registration and login with JWT
- **Market Data**: Real-time quotes and historical data from Yahoo Finance
- **User Management**: Portfolio and trade management
- **Security**: Rate limiting, CORS, input validation

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the server:
```bash
npm start
# or for development
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Market Data
- `GET /api/market/historical/:symbol` - Get historical data
- `GET /api/market/quote/:symbol` - Get current quote
- `POST /api/market/quotes` - Get multiple quotes
- `GET /api/market/options/:symbol` - Get option chain

### User Data
- `GET /api/user/portfolio` - Get user portfolio
- `POST /api/user/portfolio` - Update portfolio
- `GET /api/user/trades` - Get user trades
- `POST /api/user/trades` - Add new trade
- `PUT /api/user/trades/:id` - Update trade
- `DELETE /api/user/trades/:id` - Delete trade

## Environment Variables

- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend URL for CORS

## Development

The backend uses in-memory storage for development. For production, implement a proper database (MongoDB, PostgreSQL, etc.).