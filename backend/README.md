# KAST Backend API

The backend API for KAST - a Farcaster campaign platform that enables creators to run engagement campaigns with automated scoring and reward distribution.

## Features

- **Campaign Management**: Create and manage Farcaster engagement campaigns
- **User Management**: Handle user profiles, authentication, and wallet linking
- **Submission Processing**: Automated ingestion and scoring of Farcaster casts
- **Leaderboard System**: Real-time rankings with snapshot capabilities
- **Reward Distribution**: Automated payout system with blockchain integration
- **Project Console**: Multi-project management with role-based access
- **Background Workers**: Scalable processing for engagement data and payouts

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT with Farcaster integration
- **Blockchain**: Ethers.js for Web3 interactions
- **Caching**: Redis for session management and job queues
- **Monitoring**: Winston logging with rotation
- **Testing**: Jest with supertest for API testing

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 13+ database
- Redis server (optional but recommended)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kast-team/kast-backend.git
   cd kast-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Create database
   createdb kast_db
   
   # Run migrations
   npm run migrate:up
   
   # Optional: Seed with sample data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## Environment Configuration

Copy `.env.example` to `.env` and configure the following key variables:

### Required Configuration

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kast_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Farcaster Hub
FARCASTER_HUB_URL=https://hub-api.farcaster.xyz:2281
```

### Optional Configuration

```env
# Blockchain (for payouts)
RPC_URL=https://mainnet.infura.io/v3/your-project-id
PAYOUT_PRIVATE_KEY=your-payout-wallet-private-key

# Redis (for caching and job queues)
REDIS_URL=redis://localhost:6379

# External APIs
NEYNAR_API_KEY=your-neynar-api-key
```

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Health Check
```http
GET /api/health
```

#### Campaigns
```http
GET    /api/campaigns              # List campaigns
POST   /api/campaigns              # Create campaign (auth)
GET    /api/campaigns/:id          # Get campaign details
PUT    /api/campaigns/:id          # Update campaign (auth)
DELETE /api/campaigns/:id          # Delete campaign (auth)
```

#### Users
```http
GET    /api/users                  # List users
GET    /api/users/me               # Get current user (auth)
PUT    /api/users/me               # Update profile (auth)
GET    /api/users/:fid             # Get user by FID
POST   /api/users/link-wallet      # Link wallet (auth)
```

#### Submissions
```http
GET    /api/submissions            # List submissions
POST   /api/submissions            # Create submission (auth)
GET    /api/submissions/:id        # Get submission details
PUT    /api/submissions/:id/score  # Update score (auth)
```

#### Leaderboards
```http
GET    /api/leaderboards/:campaignId     # Campaign leaderboard
GET    /api/leaderboards/global          # Global leaderboard
GET    /api/leaderboards/:campaignId/rank/:userFid  # User rank
```

#### Projects
```http
GET    /api/projects               # List projects
POST   /api/projects               # Create project (auth)
GET    /api/projects/:id           # Get project details
PUT    /api/projects/:id           # Update project (auth)
DELETE /api/projects/:id           # Delete project (auth)
```

### Admin Endpoints

#### Worker Management
```http
GET    /api/admin/workers/status                    # Get worker status
POST   /api/admin/workers/:worker/:action          # Control workers
```

#### Manual Payouts
```http
POST   /api/admin/payouts/:campaignId/calculate    # Calculate payouts
POST   /api/admin/payouts/:campaignId/distribute   # Distribute payouts
```

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User profiles and authentication data
- **projects**: Project management and ownership
- **campaigns**: Campaign configuration and status
- **submissions**: User submissions and scoring data
- **leaderboard_snapshots**: Historical leaderboard data
- **payouts**: Reward distribution records
- **engagements**: Farcaster engagement metrics
- **wallet_links**: User wallet associations

### Migrations

```bash
# Run pending migrations
npm run migrate:up

# Check migration status
npm run migrate:status

# Create new migration
npm run migrate:create <migration_name>

# Rollback last migration
npm run migrate:down

# Reset database (caution!)
npm run migrate:reset
```

## Background Workers

The application includes three background workers:

### 1. Engagement Worker
- Processes Farcaster cast data
- Updates engagement metrics (likes, recasts, replies)
- Recalculates submission scores
- Handles rate limiting and error recovery

### 2. Leaderboard Worker
- Creates periodic leaderboard snapshots
- Updates campaign rankings
- Finalizes leaderboards for ended campaigns
- Maintains historical data

### 3. Payout Worker
- Calculates reward distributions
- Executes blockchain transactions
- Verifies transaction completion
- Handles payout failures and retries

### Worker Management

Workers can be controlled via API endpoints (admin only):

```bash
# Start a worker
curl -X POST http://localhost:3001/api/admin/workers/engagement/start

# Stop a worker
curl -X POST http://localhost:3001/api/admin/workers/engagement/stop

# Restart a worker
curl -X POST http://localhost:3001/api/admin/workers/engagement/restart

# Clear worker queue
curl -X POST http://localhost:3001/api/admin/workers/engagement/clear-queue
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start with hot reload
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run typecheck    # TypeScript type checking

# Database
npm run db:setup     # Setup database
npm run db:seed      # Seed sample data
```

### Project Structure

```
src/
├── models/          # Database models and queries
├── routes/          # API route handlers
├── services/        # Business logic services
├── workers/         # Background job processors
├── middleware/      # Express middleware
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── migrations/      # Database migration files
├── app.ts           # Express app configuration
└── server.ts        # Application entry point
```

### Adding New Features

1. **Database Changes**: Create migration files in `src/migrations/`
2. **Models**: Add database models in `src/models/`
3. **Routes**: Create API routes in `src/routes/`
4. **Services**: Implement business logic in `src/services/`
5. **Workers**: Add background jobs in `src/workers/`
6. **Tests**: Write tests alongside your code

## Testing

The project uses Jest for testing with the following structure:

```bash
tests/
├── unit/            # Unit tests
├── integration/     # Integration tests
├── fixtures/        # Test data
└── helpers/         # Test utilities
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=campaigns

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Deployment

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run
```

### Environment Variables for Production

Ensure these are set in production:

```env
NODE_ENV=production
JWT_SECRET=<strong-secret>
DB_HOST=<production-db-host>
DB_PASSWORD=<secure-password>
REDIS_URL=<production-redis-url>
RPC_URL=<mainnet-rpc-url>
PAYOUT_PRIVATE_KEY=<secure-private-key>
```

## Monitoring and Logging

### Logging

The application uses Winston for structured logging:

- **Console**: Development logging with colors
- **File**: Production logging with rotation
- **Error**: Separate error log files

### Health Checks

Monitor application health via:

```bash
# Basic health check
GET /api/health

# Worker status (admin)
GET /api/admin/workers/status
```

### Metrics

Key metrics to monitor:

- API response times
- Database connection pool usage
- Worker queue sizes
- Error rates
- Memory and CPU usage

## Security

### Best Practices Implemented

- **Helmet**: Security headers
- **CORS**: Cross-origin request protection
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Joi schema validation
- **SQL Injection**: Parameterized queries
- **JWT**: Secure token-based authentication
- **Environment**: Sensitive data in environment variables

### Security Checklist

- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable SSL in production
- [ ] Secure private keys
- [ ] Configure CORS properly
- [ ] Set up monitoring and alerts
- [ ] Regular security updates

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify connection settings
psql -h localhost -U postgres -d kast_db
```

#### Worker Not Processing Jobs
```bash
# Check worker status
curl http://localhost:3001/api/admin/workers/status

# Restart workers
curl -X POST http://localhost:3001/api/admin/workers/engagement/restart
```

#### High Memory Usage
- Check for memory leaks in workers
- Monitor database connection pool
- Review log file sizes

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
DEBUG_SQL=true
DEBUG_WORKERS=true
DEBUG_FARCASTER=true
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write tests for new features
- Document API changes
- Use conventional commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Join our Discord community
- Email: support@kast.app

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.