# Mammon | FX Trading System Architecture

## Overview

Mammon is a scalable currency trading application designed to handle multi-currency wallets, real-time conversions, and trading between Naira (NGN) and other international currencies. The system employs a distributed architecture with specialized services to ensure high performance, reliability, and real-time updates.

## System Architecture

The architecture follows a microservices approach with several key components:

### User-Facing Layer
- **Load Balancer (Pricing Service)**: Routes user requests to the appropriate server instance using consistent hashing based on user ID
- **Multi-Instance User Servers**: Maintain user connections and handle authentication, ensuring users connect to only one server instance regardless of device count
- **WebSocket Connections**: Established after initial HTTP connection for real-time updates

### Core Services
- **Order Service**: Processes trading requests and manages the order lifecycle
- **Exchange Order Gateways**: Interface with external exchanges for order execution
- **Database Layer**:
  - **Orders DB**: Stores order information indexed by order ID
  - **Orders-Exchange Mapping DB**: Maps internal order IDs to exchange-specific order IDs

### Exchange Integration
- **Exchange Publishers**: Push market data and order updates
- **Exchange Shards**: Handle order routing and execution
- **Stream Consumer**: Processes real-time data streams from exchanges
- **Cold Storage**: Archives completed positions

## Data Flow

1. **User Connection**: 
   - User connects through the load balancer
   - Load balancer assigns the user to a specific server instance using consistent hashing
   - WebSocket connection established for real-time updates

2. **Order Placement**:
   - User initiates order through the user server
   - Order is routed to the Order Service
   - Order is recorded in Orders DB and sent to Exchange via Order Gateway
   - Exchange returns an order ID which is mapped to internal order ID

3. **Real-time Updates**:
   - Exchange publishers push updates to the stream consumer
   - Updates are processed and forwarded to relevant user servers
   - User servers broadcast updates to connected clients

4. **Order Execution**:
   - Executed orders are updated in the Orders DB
   - Wallet balances are updated
   - Transaction records are created

## Key Design Considerations & Tradeoffs

### Consistent Hashing for User Connections
- **Benefit**: Ensures a user connects to only one server instance, reducing state synchronization issues
- **Tradeoff**: May lead to uneven load distribution if many active users hash to the same server

### Separate Databases for Orders and Exchange Mapping
- **Benefit**: Decouples internal order management from exchange-specific details
- **Tradeoff**: Introduces complexity in data synchronization and additional query overhead

### WebSocket for Real-time Updates
- **Benefit**: Low-latency updates for market data and order status
- **Tradeoff**: Requires maintaining persistent connections which can consume server resources

### Cold Storage for Positions
- **Benefit**: Optimizes performance by moving completed positions to archival storage
- **Tradeoff**: Introduces complexity in data retrieval for historical analysis

## Scalability Considerations

- **Horizontal Scaling**: Multiple instances of user servers can be added as user base grows
- **Database Sharding**: Order data can be sharded based on user ID or time periods
- **Multiple Exchange Connections**: System can connect to multiple exchanges through specialized gateways
- **Publisher Redundancy**: Multiple publisher instances ensure reliability of market data

## Future Enhancements

- **Real-time Risk Management**: Add real-time position monitoring and risk control
- **Machine Learning for Pricing**: Implement predictive models for better rate offerings
- **Cross-exchange Arbitrage**: Automatic detection and execution of arbitrage opportunities
- **Enhanced Analytics**: Real-time dashboards for user trading patterns and system performance

## Technology Stack

- **Backend Framework**: NestJS
- **Database**: PostgreSQL (for transactional data), Time-series DB (for market data)
- **Messaging**: Kafka/RabbitMQ for event-driven communication
- **Caching**: Redis for rate caching and session management
- **WebSockets**: Socket.io for real-time client-server communication
- **Authentication**: JWT with refresh token rotation
- **Monitoring**: Prometheus and Grafana for system metrics

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Redis
- Kafka/RabbitMQ

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mammon-fx-trading.git
   cd mammon-fx-trading
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.development
   ```

4. Update the environment variables in `.env.development` with your configuration

5. Start the development server:
   ```bash
   npm run start:dev
   ```

### Configuration

The system requires several environment variables to be set:

```
# Application
NODE_ENV=development
PORT=3000
APP_NAME=Mammon FX Trading

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=mammon_fx
DB_SYNC=true
DB_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Messaging
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=mammon-fx

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# External Exchange API
EXCHANGE_API_URL=https://api.exchange.com
EXCHANGE_API_KEY=your_api_key
EXCHANGE_API_SECRET=your_api_secret

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

## Development

### Project Structure

```
src/
├── common/         # Shared utilities, decorators, filters
├── config/         # Configuration modules
├── modules/
│   ├── auth/       # Authentication and authorization
│   ├── users/      # User management
│   ├── wallets/    # Multi-currency wallet management
│   ├── orders/     # Order processing and management
│   ├── exchange/   # Exchange integration
│   └── pricing/    # Real-time pricing service
├── app.module.ts
└── main.ts
```

### API Documentation

API documentation is available at `/api/docs` when running the application in development mode.

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

The application is containerized and can be deployed using Docker:

```bash
# Build the Docker image
docker build -t mammon-fx .

# Run the container
docker run -p 3000:3000 --env-file .env.production mammon-fx
```

For production deployment, consider using Docker Compose or Kubernetes to orchestrate the various services.
