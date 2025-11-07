# Best Practices for E-Commerce API

This document outlines the best practices implemented in this API and recommendations for maintaining scalability and code quality.

## Table of Contents
1. [Architecture Best Practices](#architecture-best-practices)
2. [Code Organization](#code-organization)
3. [Security Best Practices](#security-best-practices)
4. [Database Best Practices](#database-best-practices)
5. [Testing Best Practices](#testing-best-practices)
6. [Performance Best Practices](#performance-best-practices)
7. [Maintainability Best Practices](#maintainability-best-practices)

## Architecture Best Practices

### 1. Modular Monolith Design
- **Feature-based modules**: Each domain (users, products, discounts) is encapsulated in its own module
- **Clear boundaries**: Modules communicate through well-defined interfaces
- **Independent testing**: Each module can be tested in isolation
- **Future scalability**: Easy to extract into microservices if needed

### 2. Repository Pattern
```typescript
// ✅ Good: Business logic doesn't depend on database implementation
class ProductsService {
  constructor(private productRepository: ProductRepository) {}
  
  async findProduct(id: string) {
    return this.productRepository.findById(id);
  }
}

// ❌ Bad: Direct database dependency
class ProductsService {
  constructor(private productModel: Model<Product>) {}
  
  async findProduct(id: string) {
    return this.productModel.findById(id).exec();
  }
}
```

**Benefits:**
- Easy to mock for testing
- Can swap database implementations
- Consistent data access patterns
- Prevents N+1 query problems

### 3. Layered Architecture
```
HTTP Request
    ↓
Controller (validates input, handles HTTP)
    ↓
Service (business logic)
    ↓
Repository (data access)
    ↓
Database
```

**Rules:**
- Controllers should NOT contain business logic
- Services should NOT know about HTTP
- Repositories should NOT contain business logic

## Code Organization

### 1. Module Structure
```
src/modules/products/
├── dto/                    # Data Transfer Objects
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   └── product-response.dto.ts
├── products.controller.ts  # HTTP layer
├── products.service.ts     # Business logic
├── products.service.spec.ts # Unit tests
└── products.module.ts      # Module definition
```

### 2. Naming Conventions
- **Files**: kebab-case (e.g., `product-discount.schema.ts`)
- **Classes**: PascalCase (e.g., `ProductService`)
- **Variables/Functions**: camelCase (e.g., `findActiveProducts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Interfaces**: PascalCase with 'I' prefix optional (e.g., `BaseRepositoryInterface`)

### 3. Import Organization
```typescript
// 1. Node built-ins
import { join } from 'path';

// 2. External dependencies
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// 3. Internal absolute imports
import { Product } from '@database/schemas/product.schema';
import { BaseRepository } from '@database/repositories/base.repository';

// 4. Relative imports
import { CreateProductDto } from './dto/create-product.dto';
```

## Security Best Practices

### 1. Authentication & Authorization

**JWT Token Strategy:**
```typescript
// Access tokens: Short-lived (15 minutes)
// Refresh tokens: Long-lived (7 days)

// ✅ Good: Separate secrets for access and refresh tokens
{
  accessSecret: 'unique-access-secret',
  refreshSecret: 'unique-refresh-secret'
}

// ❌ Bad: Same secret for both
{
  secret: 'shared-secret'
}
```

**Role-Based Access Control:**
```typescript
// ✅ Good: Explicit role checks
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async deleteProduct(@Param('id') id: string) {}

// Public endpoints explicitly marked
@Public()
async getProducts() {}
```

### 2. Input Validation

```typescript
// ✅ Good: Strict validation with class-validator
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsNumber()
  @Min(0)
  basePrice: number;
}

// Validation pipe configuration
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,          // Strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw error on extra properties
    transform: true,           // Transform to DTO instances
  }),
);
```

### 3. Password Security

```typescript
// ✅ Good: Bcrypt with appropriate salt rounds
const saltRounds = 10; // Configurable via environment
const hashedPassword = await bcrypt.hash(password, saltRounds);

// ❌ Bad: Plain text or weak hashing
const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
```

### 4. Environment Variables

```bash
# ✅ Good: Secrets in environment variables
JWT_ACCESS_SECRET=your-secret-from-secure-vault
JWT_REFRESH_SECRET=different-secret-from-secure-vault

# ❌ Bad: Hardcoded secrets
const secret = 'my-secret-key'; // NEVER DO THIS
```

## Database Best Practices

### 1. Schema Design

**Normalized Structure:**
```typescript
// ✅ Good: Normalized references
@Schema()
export class Product {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  categoryId: MongooseSchema.Types.ObjectId;
}

// ❌ Bad: Embedded documents for frequently changing data
@Schema()
export class Product {
  @Prop({ type: Object })
  category: { name: string; slug: string }; // Data duplication!
}
```

### 2. Indexing

```typescript
// ✅ Good: Strategic indexes on frequently queried fields
ProductSchema.index({ slug: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text' }); // Full-text search

// Compound indexes for complex queries
ProductDiscountSchema.index({ productId: 1, discountId: 1 }, { unique: true });
```

**Index Guidelines:**
- Index fields used in `where` clauses
- Index fields used in `sort` operations
- Avoid over-indexing (impacts write performance)
- Use compound indexes for multi-field queries

### 3. Query Optimization

```typescript
// ✅ Good: Use lean() for read-only queries
const products = await this.model
  .find(filter)
  .lean() // Returns plain JavaScript objects
  .exec();

// ✅ Good: Select only needed fields
const products = await this.model
  .find(filter)
  .select('name price slug')
  .lean()
  .exec();

// ❌ Bad: Loading full Mongoose documents when not needed
const products = await this.model.find(filter).exec();
```

### 4. Pagination

```typescript
// ✅ Good: Always paginate list endpoints
async findAll(page: number, limit: number) {
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.model.find().skip(skip).limit(limit).lean().exec(),
    this.model.countDocuments().exec(),
  ]);
  
  return { data, total };
}

// ❌ Bad: Returning all records
async findAll() {
  return this.model.find().exec(); // Could return millions of records!
}
```

## Testing Best Practices

### 1. Unit Tests

```typescript
// ✅ Good: Test business logic with mocked dependencies
describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    // Mock repository
    repository = {
      findById: jest.fn(),
      create: jest.fn(),
    } as any;

    service = new ProductsService(repository);
  });

  it('should create product', async () => {
    repository.create.mockResolvedValue(mockProduct);
    const result = await service.create(createDto);
    expect(result).toEqual(mockProduct);
  });
});
```

### 2. Integration Tests

```typescript
// ✅ Good: Use in-memory database for integration tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  const module = await Test.createTestingModule({
    imports: [MongooseModule.forRoot(mongoUri), AppModule],
  }).compile();
});
```

### 3. Test Coverage Goals
- **Unit tests**: 80%+ coverage for services
- **Integration tests**: Cover critical user flows
- **E2E tests**: Cover main API endpoints

## Performance Best Practices

### 1. Database Connection Pooling

```typescript
// ✅ Good: Configure connection pool
MongooseModule.forRootAsync({
  useFactory: async (config: ConfigService) => ({
    uri: config.get<string>('database.uri'),
    retryAttempts: 3,
    retryDelay: 1000,
    // Connection pool managed automatically by Mongoose
  }),
});
```

### 2. Caching Strategy

```typescript
// Future implementation with Redis
@Injectable()
export class ProductsService {
  async findOne(id: string) {
    // Check cache first
    const cached = await this.cacheManager.get(`product:${id}`);
    if (cached) return cached;
    
    // Fetch from database
    const product = await this.repository.findById(id);
    
    // Cache result
    await this.cacheManager.set(`product:${id}`, product, 3600);
    
    return product;
  }
}
```

### 3. Efficient Pricing Calculation

```typescript
// ✅ Good: Calculate pricing in application layer
private async calculateProductPricing(product: Product) {
  const discounts = await this.getApplicableDiscounts(product.id);
  return this.applyBestDiscount(product.basePrice, discounts);
}

// Store final price in orders for historical accuracy
await this.orderRepository.create({
  productId: product.id,
  basePrice: product.basePrice,
  finalPrice: calculatedPrice, // Snapshot at time of purchase
  appliedDiscountId: discount.id,
});
```

### 4. Avoid N+1 Queries

```typescript
// ✅ Good: Batch operations
async getProductsWithDiscounts(productIds: string[]) {
  const [products, discounts] = await Promise.all([
    this.productRepository.findByIds(productIds),
    this.discountRepository.findByProductIds(productIds),
  ]);
  
  return this.mergeProductsWithDiscounts(products, discounts);
}

// ❌ Bad: N+1 query problem
async getProductsWithDiscounts(productIds: string[]) {
  const products = await this.productRepository.findByIds(productIds);
  
  for (const product of products) {
    product.discounts = await this.discountRepository.findByProduct(product.id);
  }
  
  return products;
}
```

## Maintainability Best Practices

### 1. Code Documentation

```typescript
/**
 * Calculate final price after applying applicable discounts
 * 
 * This is the pricing orchestration logic that:
 * 1. Fetches all applicable discounts for the product
 * 2. Filters by date range and active status
 * 3. Applies the best discount (maximum savings)
 * 
 * @param product - The product to calculate pricing for
 * @returns Product with final price and applied discounts
 */
private async calculateProductPricing(product: Product): Promise<ProductResponseDto> {
  // Implementation
}
```

### 2. Error Handling

```typescript
// ✅ Good: Use appropriate HTTP exceptions
if (!user) {
  throw new NotFoundException(`User with ID ${id} not found`);
}

if (user.email === existingUser.email) {
  throw new ConflictException('User with this email already exists');
}

if (!isPasswordValid) {
  throw new UnauthorizedException('Invalid credentials');
}

// ✅ Good: Global exception filter for consistent errors
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Consistent error response format
  }
}
```

### 3. Configuration Management

```typescript
// ✅ Good: Type-safe configuration
export default () => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  },
});

// Access configuration
constructor(private configService: ConfigService) {
  this.port = this.configService.get<number>('app.port');
}
```

### 4. Logging

```typescript
// ✅ Good: Structured logging with interceptor
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(`${method} ${url} - ${responseTime}ms`);
      }),
    );
  }
}
```

### 5. Code Formatting

```bash
# ✅ Use Biome for consistent code style
npm run check    # Check and fix issues
npm run lint     # Lint only
npm run format   # Format only
```

## Scalability Checklist

- [ ] **Stateless design**: No server-side sessions (using JWT)
- [ ] **Database indexes**: All frequently queried fields indexed
- [ ] **Connection pooling**: Configured and monitored
- [ ] **Pagination**: All list endpoints paginated
- [ ] **Repository pattern**: Data access abstracted
- [ ] **Error handling**: Global exception filter in place
- [ ] **Validation**: Input validated at entry points
- [ ] **Security**: Authentication, authorization, CORS configured
- [ ] **Testing**: Unit and integration tests written
- [ ] **Documentation**: Swagger auto-generated from code
- [ ] **Configuration**: Environment-based configuration
- [ ] **Logging**: Structured logging with interceptors
- [ ] **Code quality**: Linting and formatting automated

## Future Enhancements

### Short-term (1-3 months)
1. **Rate limiting**: Prevent API abuse
2. **Redis caching**: Cache frequently accessed data
3. **File uploads**: Product image management
4. **Email notifications**: Order confirmations, password resets
5. **API versioning**: Multiple API versions support

### Medium-term (3-6 months)
1. **Background jobs**: Queue-based processing with Bull
2. **Full-text search**: MongoDB Atlas Search or Elasticsearch
3. **Webhooks**: Event-driven integrations
4. **Analytics**: Usage tracking and reporting
5. **Multi-tenancy**: Support multiple merchants

### Long-term (6-12 months)
1. **Microservices**: Extract high-traffic modules
2. **Event sourcing**: Audit trail for orders
3. **GraphQL API**: Alternative to REST
4. **Internationalization**: Multi-language support
5. **Real-time features**: WebSocket support for notifications

## Monitoring & Observability

### Key Metrics to Track
1. **Request rate**: Requests per second
2. **Response time**: p50, p95, p99 latencies
3. **Error rate**: 4xx and 5xx errors
4. **Database performance**: Query execution time
5. **Memory usage**: Monitor for memory leaks
6. **CPU usage**: Identify performance bottlenecks

### Tools to Consider
- **APM**: New Relic, Datadog, or Application Insights
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Metrics**: Prometheus + Grafana
- **Uptime**: Pingdom, UptimeRobot

## Conclusion

Following these best practices ensures:
- **Scalable**: Can handle increasing load
- **Maintainable**: Easy to understand and modify
- **Testable**: Comprehensive test coverage
- **Secure**: Protected against common vulnerabilities
- **Performant**: Optimized for speed and efficiency

Remember: **Best practices evolve**. Regularly review and update these practices as the technology landscape changes.

