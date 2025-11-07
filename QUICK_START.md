# Quick Start Guide

## Prerequisites

Before starting the application, ensure you have:

1. **Node.js** (v18 or higher) ✅ Installed
2. **MongoDB** (v6 or higher) - Required to run the application

## Starting MongoDB

### Option 1: Local MongoDB Installation

If you have MongoDB installed locally:

```bash
# Start MongoDB service (Windows)
net start MongoDB

# Or use MongoDB Compass to start the service
```

### Option 2: MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get your connection string
4. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
   ```

### Option 3: Docker (Quick Setup)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Running the Application

### 1. Install Dependencies (if not done)
```bash
npm install
```

### 2. Configure Environment
The `.env` file is already configured with defaults:
```env
MONGODB_URI=mongodb://localhost:27017/ecommerce
PORT=3000
```

### 3. Start Development Server
```bash
npm run start:dev
```

The application will start on http://localhost:3000/api/v1

### 4. Seed Database (Optional)
```bash
npm run seed
```

This creates:
- Admin user: `admin@ecommerce.com` / `Admin123!`
- Regular user: `user@ecommerce.com` / `User123!`
- Sample products and discounts

## Accessing the Application

- **API Base URL**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/products (public endpoint)

## Common Issues

### Issue: Cannot connect to MongoDB

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
1. Check if MongoDB is running: `mongo --version` or check MongoDB service
2. Verify connection string in `.env` file
3. For MongoDB Atlas, ensure IP address is whitelisted
4. Check firewall settings

### Issue: Port 3000 already in use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Option 1: Kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Option 2: Change port in .env
PORT=3001
```

### Issue: Module not found errors

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

```bash
# Start development server (hot reload)
npm run start:dev

# Run tests
npm run test

# Format and lint code
npm run check

# Build for production
npm run build

# Run production build
npm run start:prod
```

## Testing the API

### Using Swagger UI
1. Open http://localhost:3000/api/docs
2. Try the public endpoints first (Products)
3. Register a new user via `/auth/register`
4. Use the returned `accessToken` to authenticate
5. Click "Authorize" button and paste token

### Using cURL

```bash
# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}"

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"

# Get products (public)
curl http://localhost:3000/api/v1/products
```

## Next Steps

1. ✅ Ensure MongoDB is running
2. ✅ Start the application
3. ✅ Access Swagger documentation
4. ✅ Test authentication flow
5. ✅ Explore the API endpoints
6. 📖 Read `docs/architecture.md` for system design
7. 📖 Read `docs/best-practices.md` for development guidelines

## Need Help?

- Check the logs in the terminal where `npm run start:dev` is running
- Review the error messages - they usually indicate what's wrong
- Ensure all environment variables are properly set in `.env`
- Verify MongoDB connection string format

## Success Indicators

When the application starts successfully, you should see:

```
🚀 Application is running on: http://localhost:3000/api/v1
📚 Swagger documentation: http://localhost:3000/api/docs
```

If you see this, congratulations! The API is ready to use. 🎉

