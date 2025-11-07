import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { DiscountRepository } from '../../database/repositories/discount.repository';
import { ProductRepository } from '../../database/repositories/product.repository';
import { ProductDiscountRepository } from '../../database/repositories/product-discount.repository';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProductRepository = {
    findBySku: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findWithPagination: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockProductDiscountRepository = {
    findByProduct: jest.fn(),
  };

  const mockDiscountRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductRepository,
          useValue: mockProductRepository,
        },
        {
          provide: ProductDiscountRepository,
          useValue: mockProductDiscountRepository,
        },
        {
          provide: DiscountRepository,
          useValue: mockDiscountRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product successfully', async () => {
      const createProductDto = {
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test description',
        basePrice: 99.99,
        categoryId: '123',
        sku: 'TEST-001',
      };

      const createdProduct = {
        _id: '456',
        id: '456',
        ...createProductDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductRepository.findBySku.mockResolvedValue(null);
      mockProductRepository.findBySlug.mockResolvedValue(null);
      mockProductRepository.create.mockResolvedValue(createdProduct);

      const result = await service.create(createProductDto);

      expect(result).toEqual(createdProduct);
      expect(mockProductRepository.findBySku).toHaveBeenCalledWith('TEST-001');
      expect(mockProductRepository.findBySlug).toHaveBeenCalledWith('test-product');
      expect(mockProductRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if SKU already exists', async () => {
      const createProductDto = {
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test description',
        basePrice: 99.99,
        categoryId: '123',
        sku: 'TEST-001',
      };

      mockProductRepository.findBySku.mockResolvedValue({ sku: 'TEST-001' });

      await expect(service.create(createProductDto)).rejects.toThrow(ConflictException);
      expect(mockProductRepository.findBySku).toHaveBeenCalledWith('TEST-001');
      expect(mockProductRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product with pricing', async () => {
      const product = {
        _id: '456',
        id: '456',
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test description',
        basePrice: 99.99,
        categoryId: '123',
        sku: 'TEST-001',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockProductDiscountRepository.findByProduct.mockResolvedValue([]);

      const result = await service.findOne('456');

      expect(result).toBeDefined();
      expect(result.basePrice).toBe(99.99);
      expect(mockProductRepository.findById).toHaveBeenCalledWith('456');
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('456')).rejects.toThrow(NotFoundException);
      expect(mockProductRepository.findById).toHaveBeenCalledWith('456');
    });
  });
});
