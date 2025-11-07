# E-Commerce API

A scalable, maintainable e-commerce API built with NestJS and MongoDB following best practices.

## Features

- 🔐 **JWT Authentication** with access and refresh tokens
- 👥 **User Management** with role-based access control
- 📦 **Product Management** with variations and categories
- 💰 **Flexible Discount System** supporting multiple types and conditions
- 🏗️ **Repository Pattern** for clean data access layer
- 📝 **Swagger Documentation** auto-generated from code
- ✅ **Input Validation** using class-validator
- 🧪 **Comprehensive Testing** with unit and integration tests
- 🎨 **Code Quality** with Biome (linting and formatting)
- 🔄 **API Versioning** for backward compatibility

## Architecture

This project follows a **modular monolith** architecture with clear separation of concerns:

- **Layered Architecture**: Controllers → Services → Repositories → Database
- **Repository Pattern**: Abstract data access for testability and flexibility
- **Feature Modules**: Independent, cohesive modules per business domain
- **Global Utilities**: Shared filters, interceptors, guards, and decorators

See [Architecture Documentation](./docs/architecture.md) for detailed information.

## Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.x (running locally or MongoDB Atlas)
- npm or yarn

> **Important**: MongoDB must be running before starting the application. See [QUICK_START.md](./QUICK_START.md) for setup instructions.

## Installation

```bash
# Install dependencies
npm install

# Environment is already configured with defaults in .env
# Update .env if you need to change MongoDB URI or other settings

# Ensure MongoDB is running (see QUICK_START.md)
# Then start the application
npm run start:dev
```

## Configuration

Edit `.env` file with your settings:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

## Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at:
- API: http://localhost:3000/api/v1
- Swagger Docs: http://localhost:3000/api/docs

## 🧪 Testing with Postman

We provide a complete Postman collection with all 28 API endpoints:

```bash
# Import postman_collection.json into Postman
# Collection includes auto-token management and request examples
```

**Features:**
- ✅ Auto-save authentication tokens
- ✅ Auto-save resource IDs (userId, productId, discountId)
- ✅ 28 pre-configured endpoints with examples
- ✅ Public endpoints marked (no auth required)
- ✅ Admin-only endpoints clearly labeled

**Quick Start:**
1. Import `postman_collection.json` into Postman
2. Start with **Authentication → Register** or **Login**
3. Access token is automatically saved
4. Test any endpoint!

For detailed workflows and troubleshooting, see **[POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)**

## Database Design

### Core Collections

- **users**: User accounts and authentication
- **products**: Core product information
- **product_items**: Product variations (SKUs)
- **discounts**: Discount rules and conditions
- **product_discounts**: Product-discount relationships
- **categories**: Product categorization

### Key Design Principles

- **Normalized structure** to reduce redundancy
- **Flexible discount system** (percentage, fixed amount, quantity-based)
- **Product variations** support (size, color, etc.)
- **Historical pricing** preserved in orders
- **Optimized indexes** for query performance

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and receive tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (invalidate refresh token)

### Users
- `GET /api/v1/users` - List users (admin only)
- `GET /api/v1/users/:id` - Get user details
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Products
- `GET /api/v1/products` - List products with pagination
- `GET /api/v1/products/:id` - Get product details
- `POST /api/v1/products` - Create product (admin only)
- `PATCH /api/v1/products/:id` - Update product (admin only)
- `DELETE /api/v1/products/:id` - Delete product (admin only)

### Discounts
- `GET /api/v1/discounts` - List discounts
- `GET /api/v1/discounts/:id` - Get discount details
- `POST /api/v1/discounts` - Create discount (admin only)
- `PATCH /api/v1/discounts/:id` - Update discount (admin only)
- `DELETE /api/v1/discounts/:id` - Delete discount (admin only)

## Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov

# Run integration tests
npm run test:e2e
```

## Code Quality

```bash
# Check code formatting and linting
npm run check

# Fix formatting and linting issues
npm run lint:fix
npm run format
```

## Project Structure

```
src/
├── common/              # Shared utilities
│   ├── dto/            # Base DTOs
│   ├── filters/        # Exception filters
│   ├── guards/         # Auth & RBAC guards
│   ├── interceptors/   # Logging, transform
│   ├── decorators/     # Custom decorators
│   └── utils/          # Helper functions
├── config/             # Configuration
├── database/           # Database layer
│   ├── schemas/        # Mongoose schemas
│   └── repositories/   # Repository implementations
├── modules/            # Feature modules
│   ├── auth/          # Authentication
│   ├── users/         # User management
│   ├── products/      # Product management
│   └── discounts/     # Discount management
├── app.module.ts       # Root module
└── main.ts            # Entry point
```

## Best Practices Implemented

### Scalability
- ✅ Stateless design with JWT
- ✅ Database connection pooling
- ✅ Efficient queries with indexes
- ✅ Repository pattern prevents N+1 queries

### Maintainability
- ✅ Clear module boundaries
- ✅ DRY principle
- ✅ Full TypeScript coverage
- ✅ Consistent code style (Biome)
- ✅ Comprehensive documentation

### Security
- ✅ Input validation on all DTOs
- ✅ Password hashing with bcrypt
- ✅ JWT token expiration
- ✅ Role-based access control
- ✅ CORS configuration
- ✅ Environment variable secrets

### Performance
- ✅ Database indexes
- ✅ Connection pooling
- ✅ Efficient data serialization
- ✅ Lazy module loading

## License

[MIT](LICENSE)

