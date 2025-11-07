# Postman Collection Guide

## 📦 Overview

This Postman collection provides complete API testing coverage for the E-Commerce API, including:
- ✅ Authentication (Register, Login, Refresh, Logout)
- ✅ Users Management (CRUD operations)
- ✅ Products Management (CRUD + Search)
- ✅ Discounts Management (CRUD + Product linking)

## 🚀 Quick Start

### 1. Import the Collection

1. Open Postman
2. Click **Import** button
3. Select `postman_collection.json` from the project root
4. The collection will be imported with all endpoints

### 2. Configure Base URL

The collection uses a variable for the base URL:
- **Default**: `http://localhost:3000/api/v1`
- **Change it**: Edit collection variables if your server runs on a different port

### 3. Start Testing

The collection is organized into 4 folders:
1. **Authentication** - Start here to get your access token
2. **Users** - User management endpoints
3. **Products** - Product CRUD and search
4. **Discounts** - Discount management and linking

## 🔐 Authentication Flow

### Auto-Save Tokens
The collection automatically saves tokens after successful authentication:
- Register or Login → Access token saved automatically
- All subsequent requests use the saved token
- Refresh token when access token expires

### Manual Token Setup (if needed)
1. Run **Authentication → Register** or **Login**
2. Copy the `accessToken` from the response
3. It's automatically saved to collection variables
4. All authenticated requests will use it

## 📋 Collection Variables

The collection uses these variables (auto-populated):

| Variable | Description | Auto-set |
|----------|-------------|----------|
| `baseUrl` | API base URL | No - set manually if needed |
| `accessToken` | JWT access token | ✅ Yes (from login/register) |
| `refreshToken` | JWT refresh token | ✅ Yes (from login/register) |
| `userId` | Current user ID | ✅ Yes (from responses) |
| `productId` | Last created product ID | ✅ Yes (from responses) |
| `discountId` | Last created discount ID | ✅ Yes (from responses) |

## 🎯 Testing Workflow

### Complete Testing Flow

```
1. Register/Login (Authentication)
   ↓
2. Create User (Users - Admin only)
   ↓
3. Create Product (Products - Admin only)
   ↓
4. Create Discount (Discounts - Admin only)
   ↓
5. Link Discount to Product
   ↓
6. Test Public Endpoints (no auth required)
```

### Workflow Details

#### Step 1: Get Authenticated
```
Run: Authentication → Register User
or
Run: Authentication → Login
```
✅ Access token is saved automatically

#### Step 2: Test User Endpoints
```
Run: Users → Get All Users (Admin)
Run: Users → Get User by ID
Run: Users → Update User
```

#### Step 3: Test Product Endpoints
```
Run: Products → Create Product (Admin)
Run: Products → Get All Products (Public)
Run: Products → Search Products (Public)
Run: Products → Get Product by ID
```

#### Step 4: Test Discount Endpoints
```
Run: Discounts → Create Discount (Admin)
Run: Discounts → Link Discount to Product (Admin)
Run: Products → Get Product by ID (see applied discount)
```

## 📝 Endpoint Details

### Authentication Endpoints (No Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login with credentials |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/logout` | POST | Logout (requires auth) |

### Users Endpoints (Auth Required)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/users` | POST | Admin | Create user |
| `/users` | GET | Admin | Get all users |
| `/users/:id` | GET | User | Get user by ID |
| `/users/:id` | PATCH | User | Update user |
| `/users/:id` | DELETE | Admin | Delete user |

### Products Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/products` | POST | Admin | Create product |
| `/products` | GET | Public | Get all products |
| `/products/search` | GET | Public | Search products |
| `/products/category/:id` | GET | Public | Get by category |
| `/products/slug/:slug` | GET | Public | Get by slug |
| `/products/:id` | GET | Public | Get by ID |
| `/products/:id` | PATCH | Admin | Update product |
| `/products/:id` | DELETE | Admin | Delete product |

### Discounts Endpoints (Auth Required)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/discounts` | POST | Admin | Create discount |
| `/discounts` | GET | Admin | Get all discounts |
| `/discounts/active` | GET | User | Get active discounts |
| `/discounts/:id` | GET | User | Get by ID |
| `/discounts/:id` | PATCH | Admin | Update discount |
| `/discounts/:id` | DELETE | Admin | Delete discount |
| `/discounts/link` | POST | Admin | Link to product |
| `/discounts/link/:productId/:discountId` | DELETE | Admin | Unlink from product |
| `/discounts/:id/products` | GET | Admin | Get linked products |

## 🎨 Example Requests

### Register a New User
```json
POST /auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Create a Product (Admin)
```json
POST /products
{
  "name": "Premium Wireless Headphones",
  "slug": "premium-wireless-headphones",
  "description": "High-quality wireless headphones",
  "basePrice": 299.99,
  "categoryId": "replace-with-category-id",
  "sku": "WH-1000XM4",
  "images": ["https://example.com/image.jpg"],
  "metadata": {
    "brand": "TechBrand",
    "warranty": "2 years"
  }
}
```

### Create a Discount (Admin)
```json
POST /discounts
{
  "code": "SUMMER2024",
  "name": "Summer Sale 2024",
  "description": "20% off on selected products",
  "discountType": "percentage",
  "value": 20,
  "startDate": "2024-06-01T00:00:00.000Z",
  "endDate": "2024-08-31T23:59:59.999Z",
  "minimumOrderValue": 100,
  "maxUsageCount": 1000
}
```

### Link Discount to Product (Admin)
```json
POST /discounts/link
{
  "productId": "{{productId}}",
  "discountId": "{{discountId}}"
}
```

## 🔄 Response Examples

### Successful Authentication
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Product with Applied Discount
```json
{
  "statusCode": 200,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Premium Wireless Headphones",
    "basePrice": 299.99,
    "finalPrice": 239.99,
    "appliedDiscounts": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Summer Sale 2024",
        "discountType": "percentage",
        "value": 20
      }
    ]
  }
}
```

## ⚠️ Common Issues

### 1. 401 Unauthorized
**Cause**: Access token expired or missing
**Solution**: 
- Run **Authentication → Login** again
- Or run **Authentication → Refresh Token**

### 2. 403 Forbidden
**Cause**: Insufficient permissions (not admin)
**Solution**: 
- Use admin credentials
- Check the `role` field in your user object

### 3. 404 Not Found
**Cause**: Resource doesn't exist or wrong ID
**Solution**: 
- Verify the ID in collection variables
- Create the resource first

### 4. 409 Conflict
**Cause**: Duplicate email, SKU, or slug
**Solution**: 
- Use unique values
- Check existing records first

## 🧪 Testing Tips

### 1. Run in Order
Follow the workflow order for best results:
1. Authentication first
2. Create resources (products, discounts)
3. Test read operations
4. Test updates
5. Test deletes last

### 2. Use Collection Runner
Run the entire collection automatically:
1. Click on collection name
2. Click **Run**
3. Select all requests or specific folder
4. Click **Run Collection**

### 3. Environment Setup
For multiple environments (dev, staging, prod):
1. Create Postman environments
2. Set `baseUrl` variable per environment
3. Switch environments as needed

### 4. Save Example Responses
After running requests:
1. Click **Save Response**
2. Add as **Example**
3. Helps document expected responses

## 📊 Test Scenarios

### Scenario 1: User Registration & Product Browsing
```
1. Register User
2. Get All Products (public)
3. Search Products
4. Get Product by ID (see pricing with discounts)
```

### Scenario 2: Admin Product Management
```
1. Login as Admin
2. Create Product
3. Create Discount
4. Link Discount to Product
5. Verify Product shows discount
6. Unlink Discount
```

### Scenario 3: Discount Testing
```
1. Create Discount (percentage)
2. Create Product
3. Link them
4. Get Product (verify finalPrice calculation)
5. Update Discount value
6. Get Product again (verify new price)
```

## 🎯 Quick Reference

### Default Test Users (after seeding)
```
Admin:
- Email: admin@ecommerce.com
- Password: Admin123!

User:
- Email: user@ecommerce.com
- Password: User123!
```

### Pagination Parameters
```
?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

### Discount Types
- `percentage` - Value from 0-100
- `fixed_amount` - Value in currency units

### User Roles
- `admin` - Full access
- `user` - Limited access

## 📚 Additional Resources

- **Swagger Docs**: http://localhost:3000/api/docs
- **Architecture Docs**: `docs/architecture.md`
- **Best Practices**: `docs/best-practices.md`

## 🆘 Need Help?

If you encounter issues:
1. Check the server is running: `npm run start:dev`
2. Verify MongoDB is connected
3. Check Postman Console for request/response details
4. Review error messages in response body

Happy Testing! 🚀

