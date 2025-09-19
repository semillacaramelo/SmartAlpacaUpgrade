<!-- Language: Markdown -->

# Smart Alpaca Upgrade

A sophisticated AI-powered algorithmic trading platform built with modern web technologies. This application combines real-time market data, AI-driven strategy generation, and automated trade execution through the Alpaca trading API.

## 🚀 Features

### Core Trading Features

- **Real-time Portfolio Tracking**: Live portfolio value, P&L, and position monitoring
- **AI Strategy Generation**: Automated strategy creation using Google Gemini AI
- **Backtesting Engine**: Historical performance analysis and validation
- **Risk Management**: Configurable position sizing and stop-loss parameters
- **Multi-asset Support**: Trade across various asset classes

### AI Pipeline

- **Market Analysis**: Real-time market trend and volatility assessment
- **Asset Selection**: AI-powered asset ranking and selection
- **Strategy Generation**: Automated creation of trading strategies
- **Performance Validation**: Backtesting and risk assessment
- **Automated Execution**: Hands-free trade execution and monitoring

### Technical Features

- **Real-time WebSocket Updates**: Live data streaming and notifications
- **Responsive Dashboard**: Modern React-based UI with Tailwind CSS
- **Type-Safe Architecture**: Full TypeScript implementation
- **Database Integration**: PostgreSQL with Drizzle ORM
- **Comprehensive Logging**: Audit trails and system monitoring

## 🏗️ Architecture

### Frontend (Client)

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **Wouter** for client-side routing
- **Radix UI** components for accessibility

### Backend (Server)

- **Express.js** with TypeScript
- **WebSocket** for real-time communication
- **PostgreSQL** database with Drizzle ORM
- **Google Gemini AI** for market analysis and strategy generation
- **Alpaca API** integration for trade execution

### Database Schema

- **Users & Portfolios**: User management and portfolio tracking
- **Positions & Trades**: Trade execution and position management
- **Strategies**: AI-generated trading strategies
- **AI Decisions**: Pipeline decision tracking
- **Audit Logs**: Comprehensive system logging
- **System Health**: Service monitoring and metrics

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis server
- Alpaca trading account (for live trading)
- Google AI API key (for Gemini AI)

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/smart_alpaca

# Alpaca API (Paper trading by default)
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets

# Google AI
GEMINI_API_KEY=your_gemini_api_key

# Server
PORT=5000
NODE_ENV=development
```

## 📖 Documentation

- **[API Documentation](docs/API.md)** - Complete API endpoint reference
- **[Component Library](docs/COMPONENTS.md)** - React component documentation
- **[Historical Context](docs/HISTORICAL_CONTEXT.md)** - Development journey and task completion tracking
- **[Paper to Live Trading](docs/PAPER_TO_LIVE_CHECKLIST.md)** - Production deployment checklist

## 🏗️ Project Status

✅ **Production Ready (100% Complete)**

All major systems have been implemented and tested:
- Error handling system with toast notifications and retry logic
- Portfolio management with real-time P&L calculations  
- Position lifecycle management and risk controls
- Performance monitoring and metrics collection
- Comprehensive testing infrastructure
- AI pipeline with 6-stage BullMQ workflow
- WebSocket real-time communications
- Database audit logging and correlation tracking

## 📄 License

This project is private and proprietary.
