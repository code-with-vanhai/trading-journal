# Trading Journal & Strategy Sharing Platform

A comprehensive web application designed for stock traders to systematically log, analyze, and reflect on their trading activities. This platform enables users to track portfolio performance, maintain detailed trading journals, and share strategies within a community of traders.

![Trading Journal Dashboard](https://github.com/user-attachments/assets/72ca3164-57a3-4578-bc86-7653e76a0fee)
![Portfolio Analysis](https://github.com/user-attachments/assets/09b2f743-fbaf-49de-9cc6-74c9ffefe9ea)

## 🎯 Purpose & Vision

The Trading Journal platform addresses the critical need for systematic record-keeping and performance analysis in stock trading. By providing tools for transaction logging, emotional reflection, and strategy documentation, it helps traders:

- **Improve Trading Discipline**: Systematic logging encourages consistent trading practices
- **Learn from Past Decisions**: Detailed journal entries with emotional context help identify patterns
- **Track Performance**: Real-time portfolio analysis with profit/loss calculations
- **Share Knowledge**: Community-driven strategy sharing to learn from other traders
- **Make Data-Driven Decisions**: Historical analysis and market data integration for informed trading

## 🚀 Core Functions

### Transaction Management
- **Buy/Sell Recording**: Log all stock transactions with precise details
- **Fee & Tax Tracking**: Account for all trading costs and tax implications
- **Real-time Portfolio**: Calculate current positions from transaction history
- **Performance Analytics**: Automated profit/loss calculations and performance metrics

### Trading Psychology
- **Emotional Journaling**: Record emotions during entry and exit points
- **Strategy Documentation**: Link specific strategies to individual trades
- **Post-Trade Reviews**: Systematic reflection on trading decisions
- **Tag System**: Categorize trades and journal entries for easy analysis

### Market Data Integration
- **Vietnamese Stock Market**: Real-time data via TCBS (Techcom Securities) API
- **Price Caching**: Intelligent caching system to minimize API calls and improve performance
- **Historical Charts**: Visual representation of stock performance and portfolio trends

### Community Features
- **Strategy Sharing**: Publish and discover trading strategies
- **Knowledge Exchange**: Learn from successful traders in the community
- **Performance Benchmarking**: Compare trading results with peer strategies

## 🛠️ Technology Stack

### Frontend Framework
- **[Next.js](https://nextjs.org/)** (App Router) - React-based full-stack framework
- **[React 18](https://reactjs.org/)** - Component-based UI library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework for responsive design

### Backend & Database
- **[PostgreSQL](https://www.postgresql.org/)** - Primary relational database
- **[Prisma ORM](https://www.prisma.io/)** - Type-safe database toolkit and query builder
- **[NextAuth.js](https://next-auth.js.org/)** - Complete authentication solution with session management

### Data Visualization
- **[Chart.js](https://www.chartjs.org/)** - Flexible charting library
- **[react-chartjs-2](https://react-chartjs-2.js.org/)** - React wrapper for Chart.js
- **[Recharts](https://recharts.org/)** - React-native charting library

### Security & Performance
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Password hashing and security
- **In-memory Caching** - Custom caching layer for API optimization
- **[date-fns](https://date-fns.org/)** - Modern date utility library

### External APIs
- **TCBS API** (Techcom Securities) - Vietnamese stock market data provider
- **[node-fetch](https://github.com/node-fetch/node-fetch)** - HTTP client for API calls

### Development Tools
- **[dotenv](https://github.com/motdotla/dotenv)** - Environment variable management
- **Custom Logging System** - Dual-environment logging for development and production

## ✨ Core Features

### 🔐 User Management
- **Secure Authentication**: Email/username login with NextAuth.js integration
- **Session Management**: 30-minute automatic timeout with activity monitoring
- **Session Warnings**: Pre-expiration notifications and graceful re-authentication
- **User Profiles**: Customizable user information and preferences

### 📊 Advanced Transaction Management
- **Comprehensive Recording**: BUY/SELL transactions with ticker, quantity, price, and date
- **Cost Tracking**: Detailed fee and tax management per transaction
- **Smart Filtering**: Filter by ticker, type, date range, and price range
- **Server-Side Sorting**: All columns sortable with visual indicators
- **Flexible Pagination**: Configurable page sizes (10/25/50/100 items)
- **URL Synchronization**: Shareable filtered views via URL parameters

### 📈 Portfolio Tracking & Analytics
- **Real-Time Positions**: Automatically calculated from transaction history
- **P&L Analysis**: Profit/loss calculations with detailed breakdowns
- **Performance Metrics**: ROI, win/loss ratios, and trend analysis
- **Visual Dashboards**: Interactive charts and graphs for portfolio visualization
- **Market Data Integration**: Live stock prices with intelligent caching

### 📝 Trading Journal & Psychology
- **Transaction-Linked Journals**: One-to-one relationship between trades and journal entries
- **Emotional Tracking**: Record entry and exit emotions for psychological analysis
- **Strategy Documentation**: Link specific strategies to individual trades
- **Post-Trade Reviews**: Systematic reflection and learning documentation
- **Personal Tag System**: Many-to-many tagging for categorization and analysis

### 🤝 Strategy Sharing Community
- **Public Strategy Library**: Browse and discover trading strategies
- **Personal Strategy Management**: Create, edit, and manage your own strategies
- **Community Interaction**: Learn from other traders' experiences and approaches
- **Strategy Analytics**: Track which strategies are most popular and effective

### ⚡ Performance Optimizations
- **Intelligent Caching**: 5-minute TTL for transaction lists, 3-minute for individual transactions
- **Stock Price Caching**: Database-backed caching to minimize TCBS API calls
- **Query Optimization**: Raw SQL queries for performance-critical operations
- **Memory Management**: Singleton Prisma instance and LRU cache eviction
- **Response Times**: <200ms for cached requests, <50ms for highly cached data

## 🗄️ Database Schema

### Core Models

#### **User**
- User credentials, profile information, and authentication data
- Links to all user-owned data (transactions, journals, tags, strategies)
- Supports both email and username-based authentication

#### **Transaction**
- Individual stock trading records (BUY/SELL operations)
- Financial details: ticker, quantity, price, fees, taxes
- Calculated profit/loss and transaction notes
- Optimized with indexes on userId+transactionDate and userId+ticker

#### **JournalEntry**
- Personal reflections linked one-to-one with transactions
- Emotional tracking (entry/exit emotions)
- Strategy documentation and post-trade reviews
- Many-to-many relationship with personal tags

#### **Tag**
- User-defined categorization system for journal entries
- Personal to each user (isolated tag namespaces)
- Enables advanced filtering and analysis of trading patterns

#### **Strategy**
- Public trading strategies shared within the community
- User-authored content with title and detailed descriptions
- Indexed for efficient browsing and discovery

#### **StockPriceCache**
- Database-backed caching for stock prices from TCBS API
- Configurable cache duration (default: 1 hour)
- Includes metadata for additional market data
- Optimized with indexes on symbol and lastUpdatedAt

## 🔌 API Endpoints

### Authentication & User Management
```
GET/POST /api/auth/[...nextauth]  # NextAuth.js authentication routes
POST      /api/auth/register      # User registration endpoint
```

### Transaction Management
```
GET     /api/transactions           # List with filtering, pagination, sorting
POST    /api/transactions           # Create new transaction
GET     /api/transactions/:id       # Get specific transaction details
PUT     /api/transactions/:id       # Update existing transaction
DELETE  /api/transactions/:id       # Delete transaction
```

### Journal & Tags
```
GET     /api/journal                # List user's journal entries
POST    /api/journal                # Create journal entry for transaction
GET     /api/journal/tags           # List user's personal tags
POST    /api/journal/tags           # Create new tag
DELETE  /api/journal/tags/:id       # Delete specific tag
```

### Strategy Sharing
```
GET     /api/strategies             # List public strategies
POST    /api/strategies             # Create new strategy
GET     /api/strategies/me          # User's own strategies
GET     /api/strategies/latest      # Latest public strategies
GET     /api/strategies/:id         # Get specific strategy
PUT     /api/strategies/:id         # Update strategy
DELETE  /api/strategies/:id         # Delete strategy
```

### Analytics & Market Data
```
GET     /api/portfolio              # User's portfolio data and analytics
GET     /api/analysis               # Trading performance analysis
GET     /api/market-data            # Market data with TCBS integration
```

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** (v18+ recommended)
- **PostgreSQL** (v12+ recommended)
- **Git** for version control

### 1. Clone Repository
```bash
git clone <repository-url>
cd trading-journal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Install PostgreSQL
**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### Create Database
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE trading_journal;
CREATE USER tjuser WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE trading_journal TO tjuser;
\q
```

### 4. Environment Configuration

Create `.env` file in project root:
```env
# Database connection
DATABASE_URL="postgresql://tjuser:your_secure_password@localhost:5432/trading_journal"

# NextAuth.js configuration
NEXTAUTH_SECRET="your_generated_secret_key"
NEXTAUTH_URL="http://localhost:3000"

# TCBS API (Vietnamese stock market data)
TCBS_API_URL="https://apipubaws.tcbs.com.vn"

# Stock price cache duration (1 hour = 3600000ms)
STOCK_PRICE_CACHE_DURATION=3600000
```

**Generate NextAuth Secret:**
Visit [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) for a secure secret key.

### 5. Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma migrate dev

# Optional: View database in Prisma Studio
npx prisma studio
```

### 6. Development Server
```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000)

### 7. Production Build
```bash
npm run build
npm start
```

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run cleanup:cache` - Clean application cache
- `npm run debug:tcbs` - Debug TCBS API connection
- `npm run debug:market-data` - Test market data functionality
- `npm run test:market-data` - Run market data function tests

## 🔧 Configuration

### Stock Price Caching
The application implements intelligent caching for stock prices:
- **Default Duration**: 1 hour (configurable via `STOCK_PRICE_CACHE_DURATION`)
- **Automatic Refresh**: Expired cache triggers new API requests
- **Fallback Mechanism**: Uses stale cache data if API fails
- **Performance Impact**: Up to 10x faster loading for cached data

### Session Management
- **Timeout**: 30 minutes of inactivity
- **Warning Period**: 2 minutes before expiration
- **Activity Tracking**: Mouse, keyboard, and scroll events extend session
- **Graceful Re-auth**: Modal-based login without page refresh

### API Performance
- **Response Times**: <200ms average for transaction lists
- **Caching Strategy**: In-memory with TTL-based expiration
- **Query Optimization**: Raw SQL for performance-critical paths
- **Error Handling**: Comprehensive logging and user-friendly error messages

## 🌐 Deployment Considerations

### Production Database
- Use managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
- Configure connection pooling for better performance
- Set up automated backups and monitoring
- Enable SSL/TLS for secure connections

### Environment Variables
- Use secure secret management for production
- Configure proper CORS settings for API endpoints
- Set appropriate cache durations based on usage patterns
- Monitor API rate limits for TCBS integration

### Performance Monitoring
- Implement application performance monitoring (APM)
- Set up database query monitoring
- Configure alerts for API failures and high response times
- Regular cache cleanup and optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License. See the LICENSE file for details.

## 🙏 Acknowledgements

- **Vietnamese Trading Community** for requirements and feedback
- **TCBS (Techcom Securities)** for providing market data API
- **Open Source Libraries** that make this project possible:
  - Next.js team for the amazing framework
  - Prisma team for the excellent ORM
  - NextAuth.js for authentication solutions
  - Chart.js and Recharts for visualization tools
  - Tailwind CSS for the utility-first styling approach

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check existing documentation and FAQ
- Review the troubleshooting section in POSTGRES_MIGRATION.md

---

**Built for traders, by traders** 📈 **Happy Trading!** 🚀
