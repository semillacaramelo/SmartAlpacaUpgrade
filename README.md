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

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/semillacaramelo/SmartAlpacaUpgrade.git
   cd smart-alpaca-upgrade
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Production Build

```bash
npm run build
npm start
```

## 📊 API Documentation

### Portfolio Endpoints
- `GET /api/portfolio/status` - Get portfolio overview and metrics
- `GET /api/positions/open` - Get all open positions

### Trading Endpoints
- `POST /api/trade/execute` - Execute a trade order
- `POST /api/backtest/run` - Run strategy backtest

### AI Pipeline Endpoints
- `POST /api/bot/start` - Start AI trading cycle
- `POST /api/bot/stop` - Stop AI trading cycle
- `GET /api/bot/status` - Get bot status

### Data Endpoints
- `GET /api/strategies` - Get trading strategies
- `GET /api/audit-logs` - Get system audit logs
- `GET /api/market-data` - Get market data

## 🔧 Configuration

### VS Code Setup
The project includes optimized VS Code settings:
- TypeScript strict mode enabled
- ESLint and Prettier integration
- Recommended extensions for React/TypeScript development

### Database Configuration
The application uses Drizzle ORM with PostgreSQL. Schema migrations are handled automatically with:
```bash
npm run db:push
```

## 🤖 AI Pipeline Stages

1. **Market Scan**: Analyze current market conditions
2. **Asset Selection**: Rank and select optimal assets
3. **Strategy Generation**: Create trading strategies using AI
4. **Validation**: Backtest strategies for performance
5. **Staging**: Prepare strategies for execution
6. **Execution**: Monitor and execute trades automatically

## 📈 Trading Strategies

The AI generates strategies based on:
- Technical indicators (RSI, MACD, Bollinger Bands)
- Market volatility and trends
- Risk-reward ratios
- Historical performance data

## 🔒 Security

- Environment-based configuration
- Input validation with Zod schemas
- Secure API key management
- Audit logging for all trading activities

## 📝 Development

### Project Structure
```
smart-alpaca-upgrade/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/                 # Backend Express application
│   ├── services/          # Business logic services
│   ├── routes.ts          # API route definitions
│   └── storage.ts         # Database operations
├── shared/                 # Shared types and schemas
└── docs/                  # Documentation
```

### Key Technologies
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, WebSocket
- **Database**: PostgreSQL, Drizzle ORM
- **AI**: Google Gemini API
- **Trading**: Alpaca API
- **State Management**: React Query, Zustand

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Setup
- Use paper trading for development/testing
- Set up proper monitoring and alerting
- Configure backup strategies for database
- Implement rate limiting for API endpoints

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the audit logs for system diagnostics

---

**Disclaimer**: This software is for educational and research purposes. Always test thoroughly before using with real money. Trading involves risk and past performance does not guarantee future results.
