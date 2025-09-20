# Smart Alpaca - Windows Development Quick Start

This guide provides rapid setup instructions for Windows developers joining the Smart Alpaca project.

## 🚀 One-Command Setup

### Prerequisites
- Windows 10/11
- Node.js 18+ installed
- PostgreSQL installed (any version, detected automatically)
- Git for Windows

### Quick Setup (5 minutes)

```powershell
# 1. Clone repository
git clone <repository-url>
cd SmartAlpacaUpgrade

# 2. Install dependencies
npm install

# 3. Configure PostgreSQL PATH (one-time setup)
.\scripts\setup-postgresql-path.ps1

# 4. Setup environment variables
cp .env.example .env
# Edit .env file with your API keys

# 5. Initialize database
npm run db:push

# 6. Start development
npm run dev
```

**That's it!** 🎉 The application will be running at `http://localhost:5000`

## 📋 What the Scripts Do

### PostgreSQL PATH Configuration
- **Finds your PostgreSQL installation automatically**
- **Adds `psql` command to your PATH**
- **Before**: `& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U user -d db`
- **After**: `psql -U user -d db`

### Automated Service Management
- **Detects and starts PostgreSQL service**
- **Manages Redis connection**
- **Runs automatically when you open VS Code**

## 🛠️ Development Commands

### Daily Development
```powershell
npm run dev          # Start main server (port 5000)
npm run dev:worker   # Start AI pipeline worker
npm test             # Run all tests
npm run check        # TypeScript validation
```

### Database Operations
```powershell
npm run db:push      # Apply schema changes
npm run db:studio    # Open Drizzle Studio (database UI)
psql -U smart_alpaca_user -h localhost -d smart_alpaca  # Direct database access
```

### Service Management
```powershell
.\scripts\start-services.ps1                    # Manual service check/start
Get-Service -Name "*postgre*"                   # Check PostgreSQL status
Test-NetConnection -ComputerName localhost -Port 6379  # Check Redis
```

## 🔧 VS Code Integration

### Automatic Features
- **Service startup on workspace open**
- **PostgreSQL and Redis automatically detected**
- **Task menu integration** (`Ctrl+Shift+P` → "Tasks: Run Task")

### Useful VS Code Commands
- **Start PostgreSQL and Redis**: Pre-configured task
- **TypeScript compilation**: Real-time error checking
- **Integrated terminal**: PowerShell with proper PATH configuration

## 🚨 Troubleshooting

### "psql command not found"
```powershell
# Re-run PostgreSQL PATH setup
.\scripts\setup-postgresql-path.ps1

# For system-wide access (requires admin)
.\scripts\setup-postgresql-path.ps1 -SystemWide

# Restart VS Code after running
```

### "Cannot connect to database"
```powershell
# Check PostgreSQL service
Get-Service -Name "*postgre*" | Where-Object {$_.Status -eq "Running"}

# Manual service start if needed
Start-Service postgresql-x64-*

# Verify connection
psql -U postgres -c "SELECT version();"
```

### "Redis connection failed"
```powershell
# Check Redis connectivity
Test-NetConnection -ComputerName localhost -Port 6379

# If Redis not installed, the app will show specific setup instructions
```

### "VS Code task fails"
1. **Restart VS Code** completely
2. **Check PowerShell execution policy**: `Get-ExecutionPolicy`
3. **Set execution policy if needed**: `Set-ExecutionPolicy RemoteSigned`
4. **Re-run setup**: `.\scripts\setup-postgresql-path.ps1`

## 📚 Additional Resources

### Documentation
- **[Complete API Documentation](docs/API.md)**
- **[Component Library](docs/COMPONENTS.md)**
- **[Development History](docs/HISTORICAL_CONTEXT.md)**
- **[PostgreSQL Setup Details](scripts/README-PostgreSQL-PATH.md)**

### Architecture Overview
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + WebSocket + PostgreSQL
- **AI Pipeline**: BullMQ + Google Gemini + Redis
- **Trading**: Alpaca API (paper trading by default)

### Environment Files
```env
# .env - Your API keys and configuration
DATABASE_URL=postgresql://smart_alpaca_user:smart_alpaca_pass@localhost:5432/smart_alpaca
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret
GEMINI_API_KEY=your_gemini_key
```

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `npm run dev` starts without errors
- [ ] `http://localhost:5000` loads the application
- [ ] `psql --version` shows PostgreSQL version
- [ ] `psql -U smart_alpaca_user -h localhost -d smart_alpaca` connects to database
- [ ] VS Code tasks work properly
- [ ] Tests pass: `npm test`

**Welcome to Smart Alpaca development!** 🦙📈