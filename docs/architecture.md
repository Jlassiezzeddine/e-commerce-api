# E-Commerce API Architecture

## Overview

This is a scalable, maintainable e-commerce API built with NestJS and MongoDB, following best practices for modern backend development.

## Architecture Principles

### 1. Modular Monolith Architecture

The application is structured as a modular monolith, allowing for:
- **Clear boundaries** between business domains
- **Independent testing** of each module
- **Future evolution** to microservices if needed
- **Simplified development** and deployment

### 2. Layered Architecture

Each module follows a layered architecture:

```
Controllers (HTTP Layer)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Database (MongoDB)
```

### 3. Repository Pattern

The repository pattern abstracts data access logic:
- **Separation of concerns**: Business logic doesn't depend on database implementation
- **Testability**: Easy to mock repositories for unit testing
- **Flexibility**: Can swap database implementations without changing business logic
- **Consistency**: Standardized data access patterns across the application

## Project Structure

```
src/
├── common/              # Shared utilities, DTOs, filters, interceptors
│   ├── dto/            # Base DTOs and common data transfer objects
│   ├── filters/        # Exception filters
│   ├── guards/         # Authentication and authorization guards
│   ├── interceptors/   # Logging, transformation interceptors
│   ├── decorators/     # Custom decorators
│   └── utils/          # Helper functions
├── config/             # Configuration management
│   ├── configuration.ts
│   └── config.module.ts
├── database/           # Database layer
│   ├── schemas/        # Mongoose schemas
│   ├── repositories/   # Repository interfaces and implementations
│   ├── interfaces/     # Database interfaces
│   └── database.module.ts
├── modules/            # Feature modules
│   ├── auth/          # Authentication & authorization
│   ├── users/         # User management
│   ├── products/      # Product management
│   └── discounts/     # Discount management
├── app.module.ts       # Root module
└── main.ts            # Application entry point
```

## Key Design Decisions

### 1. Environment-Based Configuration

- Uses `@nestjs/config` for type-safe configuration
- Supports multiple environments (.env files)
- Configuration is globally available and cached
- Secrets are never committed (use .env.example as template)

### 2. Database Design

#### Product & Discount Model

Following normalized design principles:

**Collections:**
- `users`: User accounts with authentication data
- `products`: Core product information (name, description, base_price, category)
- `product_items`: Product variations (SKUs with specific attributes like size, color, price)
- `discounts`: Discount rules (code, type, value, date range, conditions)
- `product_discounts`: Many-to-many relationship between products/items and discounts
- `categories`: Product categorization

**Key Features:**
- Normalized structure reduces redundancy
- Flexible discount system (percentage, fixed amount)
- Support for product variations (SKUs)
- Historical pricing preserved in orders
- Compound indexes for query optimization

### 3. Authentication & Authorization

- **JWT-based authentication** with access and refresh tokens
- **Access tokens**: Short-lived (15 minutes), used for API requests
- **Refresh tokens**: Long-lived (7 days), used to obtain new access tokens
- **Role-Based Access Control (RBAC)**: Guards protect routes based on user roles
- **Password security**: Bcrypt hashing with configurable salt rounds

### 4. API Design

- **RESTful endpoints** following standard conventions
- **URI versioning** (api/v1) for backward compatibility
- **Pagination** support on list endpoints
- **Filtering & sorting** capabilities
- **Swagger documentation** auto-generated from decorators
- **Consistent response format** using interceptors

### 5. Error Handling

- Global exception filter for consistent error responses
- Custom exceptions for business logic errors
- Validation errors caught and formatted
- Appropriate HTTP status codes

### 6. Logging & Monitoring

- Structured logging using interceptors
- Request/response logging in development
- Performance profiling hooks
- Error tracking and stack traces

## Best Practices Implemented

### 1. Scalability

- **Stateless design**: No server-side sessions (JWT tokens)
- **Database indexing**: Compound indexes on frequently queried fields
- **Connection pooling**: MongoDB connection pool management
- **Efficient queries**: Repository pattern prevents N+1 queries
- **Caching ready**: Configuration cached, easy to add Redis

### 2. Maintainability

- **Clear module boundaries**: Feature-based organization
- **DRY principle**: Shared utilities in common folder
- **Type safety**: Full TypeScript coverage
- **Code formatting**: Biome for consistent code style
- **Documentation**: Inline comments and Swagger docs

### 3. Testability

- **Dependency injection**: Easy to mock dependencies
- **Repository pattern**: Database logic isolated
- **Unit tests**: Each service/controller tested independently
- **Integration tests**: End-to-end testing with in-memory MongoDB
- **Test utilities**: Shared test helpers and fixtures

### 4. Security

- **Input validation**: class-validator on all DTOs
- **SQL injection prevention**: Mongoose ODM with schema validation
- **Authentication required**: Guards on protected routes
- **CORS configured**: Cross-origin requests controlled
- **Secrets management**: Environment variables for sensitive data
- **Password hashing**: Bcrypt with appropriate salt rounds
- **JWT expiration**: Time-limited tokens

### 5. Performance

- **Lazy loading**: Modules loaded on demand
- **Database indexes**: Optimized query performance
- **Transform interceptors**: Efficient data serialization
- **Validation pipes**: Input validated once at entry
- **Connection reuse**: MongoDB connection pooling

## Data Flow

### 1. Request Flow

```
Client Request
    ↓
Global Guards (Auth)
    ↓
Controller (Route Handler)
    ↓
Validation Pipe (DTO)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Database
```

### 2. Response Flow

```
Database
    ↓
Repository (Entity)
    ↓
Service (Business Logic)
    ↓
Controller (Response)
    ↓
Transform Interceptor (Formatting)
    ↓
Client Response
```

## Transaction Management

- MongoDB transactions supported via ClientSession
- Repository methods accept optional session parameter
- Transaction helpers in database module
- Rollback on business logic errors

## Pricing Logic

Pricing calculations are handled in the application layer, not the database:

1. Retrieve product base price from database
2. Fetch applicable discounts (active, date range valid)
3. Apply discount rules in order of priority
4. Calculate final price
5. Store final price in order line items (historical record)

## Future Enhancements

### Short-term
- Rate limiting
- API key authentication for third-party integrations
- Email notifications
- File upload for product images

### Medium-term
- Redis caching layer
- Full-text search with MongoDB Atlas Search
- Background job processing (Bull)
- Webhook support

### Long-term
- Event sourcing for order history
- GraphQL API alongside REST
- Microservices extraction if needed
- Multi-tenancy support

## Development Workflow

1. **Feature branches**: Develop features in isolated branches
2. **Linting**: Run Biome before commits
3. **Testing**: Write tests alongside features
4. **Documentation**: Update Swagger annotations
5. **Code review**: Peer review before merging

## Deployment Considerations

### Environment Variables
- Never commit .env files
- Use platform-specific secret management
- Validate required variables on startup

### Database
- Use MongoDB Atlas or replica sets in production
- Enable authentication and SSL
- Regular backups
- Monitor connection pool metrics

### Application
- Use process manager (PM2)
- Enable production logging
- Configure reverse proxy (nginx)
- Set up health checks
- Monitor memory and CPU usage

## Monitoring & Observability

### Metrics to Track
- Request rate and response times
- Error rates by endpoint
- Database query performance
- Memory and CPU usage
- Active connections

### Logging Strategy
- Structured JSON logs in production
- Log levels: error, warn, info, debug
- Correlation IDs for request tracking
- Centralized log aggregation (ELK stack)

## Security Checklist

- [ ] All endpoints have appropriate authentication
- [ ] Role-based access control implemented
- [ ] Input validation on all DTOs
- [ ] SQL injection prevented via Mongoose
- [ ] XSS prevention via sanitization
- [ ] CORS configured appropriately
- [ ] Rate limiting enabled
- [ ] Secrets in environment variables
- [ ] HTTPS enforced in production
- [ ] Security headers configured

## Conclusion

This architecture prioritizes:
- **Scalability**: Can handle growing traffic and data
- **Maintainability**: Easy to understand and modify
- **Testability**: Comprehensive test coverage possible
- **Security**: Best practices implemented
- **Performance**: Optimized database queries and caching ready

The modular monolith approach provides the right balance between simplicity and scalability, allowing the system to evolve as requirements change.

