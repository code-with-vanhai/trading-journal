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
- **Multi-Account Management**: Support for multiple brokerage accounts with isolated tracking
- **Vietnamese Market Focus**: Specialized integration with TCBS API for Vietnamese stock market data

## 🚀 Core Functions

### 🔐 User Management & Authentication
- **Secure Registration**: Email/username-based account creation with password hashing
- **Session Management**: 30-minute automatic timeout with activity monitoring
- **Session Warnings**: Pre-expiration notifications and graceful re-authentication
- **User Profiles**: Customizable user information and preferences

### 💼 Multi-Account Transaction Management
- **Stock Account Management**: Create and manage multiple brokerage accounts
- **Transaction Recording**: Log BUY/SELL transactions with precise details
- **Fee & Tax Tracking**: Account for all trading costs and tax implications
- **FIFO P&L Calculation**: Automated profit/loss calculations using First-In-First-Out method
- **Cross-Account Analytics**: Portfolio analysis across multiple accounts
- **Stock Transfer**: Transfer stocks between different accounts

### 📊 Advanced Portfolio Analytics
- **Real-time Positions**: Calculate current positions from transaction history
- **Performance Metrics**: ROI, win/loss ratios, and trend analysis
- **Account Allocation**: Visual breakdown of holdings across different accounts
- **Historical Performance**: Track portfolio performance over time
- **Market Data Integration**: Live stock prices with intelligent caching

### 📝 Trading Psychology & Journaling
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

### 📈 Market Data Integration
- **Vietnamese Stock Market**: Real-time data via TCBS (Techcom Securities) API
- **Price Caching**: Intelligent database-backed caching system (1-hour TTL)
- **Historical Charts**: Visual representation of stock performance and portfolio trends
- **Market Data Validation**: Comprehensive error handling and data validation

## 🛠️ Technology Stack

### Frontend Framework
- **[Next.js 14](https://nextjs.org/)** (App Router) - React-based full-stack framework with server components
- **[React 18](https://reactjs.org/)** - Component-based UI library with concurrent features
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework for responsive design

### Backend & Database
- **[PostgreSQL](https://www.postgresql.org/)** - Primary relational database with ACID compliance
- **[Prisma ORM](https://www.prisma.io/)** - Type-safe database toolkit and query builder
- **[NextAuth.js v4](https://next-auth.js.org/)** - Complete authentication solution with session management

### Data Visualization
- **[Chart.js](https://www.chartjs.org/)** - Flexible charting library for interactive charts
- **[react-chartjs-2](https://react-chartjs-2.js.org/)** - React wrapper for Chart.js
- **[Recharts](https://recharts.org/)** - React-native charting library for responsive charts

### Security & Performance
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Password hashing and security
- **In-memory + Database Caching** - Multi-layer caching for optimal performance
- **[date-fns](https://date-fns.org/)** - Modern date utility library for date manipulation

### External APIs & Integration
- **TCBS API** (Techcom Securities) - Vietnamese stock market data provider
- **[node-fetch](https://github.com/node-fetch/node-fetch)** - HTTP client for API calls
- **Custom Logging System** - Dual-environment logging for development and production

### Development Tools
- **[dotenv](https://github.com/motdotla/dotenv)** - Environment variable management
- **[PostCSS](https://postcss.org/)** - CSS processing and optimization
- **[Autoprefixer](https://github.com/postcss/autoprefixer)** - CSS vendor prefixing

## ✨ Core Features

### 🔐 Advanced User Management
- **Secure Authentication**: Email/username login with NextAuth.js integration
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: 30-minute automatic timeout with activity monitoring
- **Session Warnings**: Pre-expiration notifications and graceful re-authentication
- **User Profiles**: Customizable user information and preferences

### 💼 Multi-Account Stock Management
- **Stock Account Creation**: Create multiple brokerage accounts with custom names
- **Account Isolation**: Separate tracking for different brokers/accounts
- **Account Management**: Edit, delete, and organize stock accounts
- **Cross-Account Analytics**: Portfolio analysis across all accounts
- **Stock Transfer**: Move stocks between accounts with full audit trail

### 📊 Comprehensive Transaction Management
- **Advanced Recording**: BUY/SELL transactions with ticker, quantity, price, and date
- **Cost Tracking**: Detailed fee and tax management per transaction
- **Smart Filtering**: Filter by ticker, type, date range, price range, and account
- **Server-Side Sorting**: All columns sortable with visual indicators
- **Flexible Pagination**: Configurable page sizes (10/25/50/100 items)
- **URL Synchronization**: Shareable filtered views via URL parameters
- **FIFO P&L Calculation**: Automated profit/loss using First-In-First-Out method

### 📈 Advanced Portfolio Analytics
- **Real-Time Positions**: Automatically calculated from transaction history
- **Multi-Account View**: Portfolio breakdown across different accounts
- **P&L Analysis**: Profit/loss calculations with detailed breakdowns
- **Performance Metrics**: ROI, win/loss ratios, and trend analysis
- **Visual Dashboards**: Interactive charts and graphs for portfolio visualization
- **Account Allocation**: Pie charts showing distribution across accounts

### 📝 Enhanced Trading Journal
- **Transaction-Linked Journals**: One-to-one relationship between trades and journal entries
- **Emotional Tracking**: Record entry and exit emotions for psychological analysis
- **Strategy Documentation**: Link specific strategies to individual trades
- **Post-Trade Reviews**: Systematic reflection and learning documentation
- **Personal Tag System**: Many-to-many tagging for categorization and analysis
- **Tag Management**: Create, edit, and delete personal tags

### 🤝 Strategy Sharing Community
- **Public Strategy Library**: Browse and discover trading strategies
- **Personal Strategy Management**: Create, edit, and manage your own strategies
- **Latest Strategies**: View recently published strategies
- **Community Interaction**: Learn from other traders' experiences and approaches
- **Strategy CRUD**: Full create, read, update, delete operations

### ⚡ Performance Optimizations
- **Multi-Layer Caching**: In-memory + database caching for optimal performance
- **Stock Price Caching**: Database-backed caching with 1-hour TTL
- **Query Optimization**: Raw SQL queries for performance-critical operations
- **Memory Management**: Singleton Prisma instance and LRU cache eviction
- **Response Times**: <200ms for cached requests, <50ms for highly cached data
- **Intelligent Cache Invalidation**: Smart cache management for data consistency

## 🗄️ Database Schema

### Core Models

#### **User**
```prisma
model User {
  id             String         @id @default(cuid())
  email          String         @unique
  name           String?
  passwordHash   String?
  username       String         @unique
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  
  // Relations
  journalEntries JournalEntry[]
  StockAccount   StockAccount[]
  strategies     Strategy[]
  tags           Tag[]
  transactions   Transaction[]
}
```

#### **StockAccount**
```prisma
model StockAccount {
  id            String        @id
  name          String
  brokerName    String?
  accountNumber String?
  description   String?
  userId        String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime
  
  // Relations
  User          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  Transaction   Transaction[]
  
  @@unique([userId, name])
  @@index([userId])
}
```

#### **Transaction**
```prisma
model Transaction {
  id              String        @id @default(cuid())
  userId          String
  ticker          String
  type            String        // 'BUY' or 'SELL'
  quantity        Float
  price           Float
  transactionDate DateTime
  fee             Float         @default(0)
  taxRate         Float         @default(0)
  calculatedPl    Float?        // Calculated P&L for SELL transactions
  notes           String?
  stockAccountId  String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  journalEntry    JournalEntry?
  StockAccount    StockAccount  @relation(fields: [stockAccountId], references: [id])
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, transactionDate])
  @@index([userId, ticker])
  @@index([stockAccountId])
}
```

#### **JournalEntry**
```prisma
model JournalEntry {
  id              String            @id @default(cuid())
  transactionId   String            @unique
  userId          String
  emotionOnEntry  String?
  emotionOnExit   String?
  strategyUsed    String?
  postTradeReview String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  // Relations
  transaction     Transaction       @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags            JournalEntryTag[]
  
  @@index([userId])
}
```

#### **Tag & JournalEntryTag**
```prisma
model Tag {
  id             String            @id @default(cuid())
  userId         String
  name           String
  createdAt      DateTime          @default(now())
  
  // Relations
  journalEntries JournalEntryTag[]
  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, name])
}

model JournalEntryTag {
  journalEntryId String
  tagId          String
  
  // Relations
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  tag            Tag          @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([journalEntryId, tagId])
}
```

#### **Strategy**
```prisma
model Strategy {
  id        String   @id @default(cuid())
  userId    String
  title     String?
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([createdAt(sort: Desc)])
  @@index([userId])
}
```

#### **StockPriceCache**
```prisma
model StockPriceCache {
  id            String   @id @default(cuid())
  symbol        String   @unique
  price         Float
  lastUpdatedAt DateTime
  source        String   @default("tcbs")
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([symbol])
  @@index([lastUpdatedAt])
}
```

## 🔌 API Endpoints

### Authentication & User Management
```
GET/POST /api/auth/[...nextauth]  # NextAuth.js authentication routes
POST     /api/auth/register       # User registration endpoint
```

### Stock Account Management
```
GET     /api/stock-accounts        # List user's stock accounts
POST    /api/stock-accounts        # Create new stock account
PUT     /api/stock-accounts/:id    # Update stock account
DELETE  /api/stock-accounts/:id    # Delete stock account
```

### Transaction Management
```
GET     /api/transactions           # List with filtering, pagination, sorting
POST    /api/transactions           # Create new transaction
GET     /api/transactions/:id       # Get specific transaction details
PUT     /api/transactions/:id       # Update existing transaction
DELETE  /api/transactions/:id       # Delete transaction
POST    /api/transactions/transfer  # Transfer stocks between accounts
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
- **npm** or **yarn** package manager

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
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### Create Database and User
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE trading_journal;
CREATE USER tjuser WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE trading_journal TO tjuser;
ALTER USER tjuser CREATEDB;
\q
```

### 4. Environment Configuration

Create `.env` file in project root:
```env
# Database connection
DATABASE_URL="postgresql://tjuser:your_secure_password@localhost:5432/trading_journal"

# NextAuth.js configuration
NEXTAUTH_SECRET="your_generated_secret_key_32_chars_min"
NEXTAUTH_URL="http://localhost:3000"

# TCBS API (Vietnamese stock market data)
TCBS_API_URL="https://apipubaws.tcbs.com.vn"

# Stock price cache duration (1 hour = 3600000ms)
STOCK_PRICE_CACHE_DURATION=3600000

# Optional: Logging level
LOG_LEVEL="info"
```

**Generate NextAuth Secret:**
```bash
openssl rand -base64 32
```
Or visit [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)

### 5. Database Migration & Setup
```bash
# Generate Prisma client
npx prisma generate

# Apply database schema (creates tables)
npx prisma migrate dev --name init

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

### Development & Build
- `npm run dev` - Start development server with hot reload
- `npm run build` - Create optimized production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Database Management
- `npm run prisma:generate` - Generate Prisma client
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma migrate reset` - Reset database and apply all migrations
- `npx prisma studio` - Open Prisma Studio database GUI

### Debugging & Testing
- `npm run debug:tcbs` - Debug TCBS API connection
- `npm run debug:market-data` - Test market data functionality
- `npm run test:market-data` - Run market data function tests

### Maintenance
- `npm run cleanup:cache` - Clean application cache
- `npm run cleanup:cache:dry` - Preview cache cleanup (dry run)

## 🔧 Configuration

### Stock Price Caching
The application implements intelligent caching for stock prices:
- **Default Duration**: 1 hour (configurable via `STOCK_PRICE_CACHE_DURATION`)
- **Cache Storage**: Database-backed with in-memory layer
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
- **Caching Strategy**: Multi-layer with TTL-based expiration
- **Query Optimization**: Raw SQL for performance-critical paths
- **Error Handling**: Comprehensive logging and user-friendly error messages

### TCBS API Integration
- **Rate Limiting**: Intelligent request throttling
- **Error Handling**: Graceful fallback to cached data
- **Data Validation**: Comprehensive validation of API responses
- **Retry Logic**: Automatic retry with exponential backoff

## 🌐 Deployment Considerations

### Production Database
- Use managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
- Configure connection pooling for better performance
- Set up automated backups and monitoring
- Enable SSL/TLS for secure connections
- Configure proper indexes for optimal query performance

### Environment Variables
- Use secure secret management for production
- Configure proper CORS settings for API endpoints
- Set appropriate cache durations based on usage patterns
- Monitor API rate limits for TCBS integration
- Enable production logging and monitoring

### Performance Monitoring
- Implement application performance monitoring (APM)
- Set up database query monitoring
- Configure alerts for API failures and high response times
- Regular cache cleanup and optimization
- Monitor memory usage and connection pools

### Security Considerations
- Enable HTTPS in production
- Configure proper CORS policies
- Implement rate limiting for API endpoints
- Regular security updates for dependencies
- Database connection encryption

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api
npm run test:components
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Environment Setup
```bash
# Set up test database
npm run test:db:setup

# Run database migrations for testing
npm run test:db:migrate

# Seed test data
npm run test:db:seed

# Clean test database
npm run test:db:clean
```

### Database Environment Testing
When changing database environments, run the comprehensive test suite:
```bash
npm run test:db-migration
```

This will validate:
- Database connectivity
- Schema integrity
- Data migration accuracy
- API functionality
- Performance benchmarks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

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

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check database exists
psql -U tjuser -d trading_journal -c "\dt"
```

#### Prisma Issues
```bash
# Reset Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

#### TCBS API Issues
```bash
# Test API connectivity
npm run debug:tcbs

# Check API logs
tail -f logs/tcbs-api-debug.json
```

---

**Built for traders, by traders** 📈 **Happy Trading!** 🚀
