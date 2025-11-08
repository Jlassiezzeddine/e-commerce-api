import { Injectable } from '@nestjs/common';
import type { Schema as MongooseSchema } from 'mongoose';
import type { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { DatabaseException } from '../../common/exceptions/database.exception';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';
import type { DiscountRepository } from '../../database/repositories/discount.repository';
import type { ProductRepository } from '../../database/repositories/product.repository';
import type { ProductDiscountRepository } from '../../database/repositories/product-discount.repository';
import { DiscountType } from '../../database/schemas/discount.schema';
import type { Product } from '../../database/schemas/product.schema';
import type { CreateProductDto } from './dto/create-product.dto';
import type { ProductResponseDto } from './dto/product-response.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import {
  ProductConflictException,
  ProductNotFoundException,
  ProductOperationException,
} from './exceptions/product.exceptions';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productDiscountRepository: ProductDiscountRepository,
    private readonly discountRepository: DiscountRepository,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const existingBySku = await this.productRepository.findBySku(createProductDto.sku);
      if (existingBySku) {
        throw new ProductConflictException('sku', createProductDto.sku);
      }

      const existingBySlug = await this.productRepository.findBySlug(createProductDto.slug);
      if (existingBySlug) {
        throw new ProductConflictException('slug', createProductDto.slug);
      }

      return await this.productRepository.create({
        ...createProductDto,
        slug: createProductDto.slug.toLowerCase(),
        sku: createProductDto.sku.toUpperCase(),
        categoryId: createProductDto.categoryId as unknown as MongooseSchema.Types.ObjectId,
      });
    } catch (error) {
      if (error instanceof ProductConflictException) {
        throw error;
      }
      throw new DatabaseException('Failed to create product', ErrorCode.DB_004, {
        operation: 'create',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findAll(
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const { data, total } = await this.productRepository.findWithPagination(
      { isActive: true },
      page,
      limit,
      sortBy,
      sortOrder,
    );

    const productsWithPricing = await Promise.all(
      data.map((product) => this.calculateProductPricing(product)),
    );

    return {
      data: productsWithPricing,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    try {
      const product = await this.productRepository.findById(id);
      if (!product) {
        throw new ProductNotFoundException(id);
      }
      return this.calculateProductPricing(product);
    } catch (error) {
      if (error instanceof ProductNotFoundException) {
        throw error;
      }
      // Handle CastError (invalid ObjectId format) as ProductNotFoundException
      if (
        error instanceof Error &&
        (error.name === 'CastError' || error.message?.includes('Cast to ObjectId'))
      ) {
        throw new ProductNotFoundException(id);
      }
      throw new DatabaseException('Failed to find product', ErrorCode.DB_004, {
        productId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findBySlug(slug: string): Promise<ProductResponseDto> {
    try {
      const product = await this.productRepository.findBySlug(slug);
      if (!product) {
        throw new ProductNotFoundException(slug);
      }
      return this.calculateProductPricing(product);
    } catch (error) {
      if (error instanceof ProductNotFoundException) {
        throw error;
      }
      throw new DatabaseException('Failed to find product by slug', ErrorCode.DB_004, {
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findByCategory(categoryId: string): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findByCategory(categoryId);
    return Promise.all(products.map((product) => this.calculateProductPricing(product)));
  }

  async search(
    searchTerm: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const { data, total } = await this.productRepository.searchProducts(searchTerm, page, limit);

    const productsWithPricing = await Promise.all(
      data.map((product) => this.calculateProductPricing(product)),
    );

    return {
      data: productsWithPricing,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      const product = await this.productRepository.findById(id);
      if (!product) {
        throw new ProductNotFoundException(id);
      }

      if (updateProductDto.slug) {
        const existingBySlug = await this.productRepository.findBySlug(updateProductDto.slug);
        if (existingBySlug && existingBySlug.id !== id) {
          throw new ProductConflictException('slug', updateProductDto.slug);
        }
        updateProductDto.slug = updateProductDto.slug.toLowerCase();
      }

      const updated = await this.productRepository.update(id, updateProductDto);
      if (!updated) {
        throw new ProductOperationException('update', { productId: id });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof ProductNotFoundException ||
        error instanceof ProductConflictException ||
        error instanceof ProductOperationException
      ) {
        throw error;
      }
      throw new DatabaseException('Failed to update product', ErrorCode.DB_004, {
        productId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const product = await this.productRepository.findById(id);
      if (!product) {
        throw new ProductNotFoundException(id);
      }

      const deleted = await this.productRepository.delete(id);
      if (!deleted) {
        throw new ProductOperationException('delete', { productId: id });
      }
    } catch (error) {
      if (error instanceof ProductNotFoundException || error instanceof ProductOperationException) {
        throw error;
      }
      throw new DatabaseException('Failed to delete product', ErrorCode.DB_004, {
        productId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Calculate final price after applying applicable discounts
   * This is the pricing orchestration logic
   */
  private async calculateProductPricing(product: Product): Promise<ProductResponseDto> {
    const productId = product.id || product._id.toString();
    const basePrice = product.basePrice;

    // Get product-specific discounts
    const productDiscounts = await this.productDiscountRepository.findByProduct(productId);

    if (productDiscounts.length === 0) {
      return this.mapToResponseDto(product, basePrice, []);
    }

    // Fetch actual discount details
    const discountIds = productDiscounts.map((pd) => pd.discountId.toString());
    const discounts = await Promise.all(
      discountIds.map((id) => this.discountRepository.findById(id)),
    );

    // Filter valid and active discounts
    const validDiscounts = discounts.filter((discount) => {
      if (!discount || !discount.isActive) return false;
      const now = new Date();
      return discount.startDate <= now && discount.endDate >= now;
    });

    if (validDiscounts.length === 0) {
      return this.mapToResponseDto(product, basePrice, []);
    }

    // Apply discounts (for simplicity, we'll apply the best discount)
    let finalPrice = basePrice;
    let bestDiscount = null;
    let maxSavings = 0;

    for (const discount of validDiscounts) {
      let discountedPrice = basePrice;

      if (discount.discountType === DiscountType.PERCENTAGE) {
        discountedPrice = basePrice * (1 - discount.value / 100);
      } else if (discount.discountType === DiscountType.FIXED_AMOUNT) {
        discountedPrice = Math.max(0, basePrice - discount.value);
      }

      const savings = basePrice - discountedPrice;
      if (savings > maxSavings) {
        maxSavings = savings;
        finalPrice = discountedPrice;
        bestDiscount = discount;
      }
    }

    const appliedDiscounts = bestDiscount
      ? [
          {
            id: bestDiscount.id || bestDiscount._id.toString(),
            name: bestDiscount.name,
            discountType: bestDiscount.discountType,
            value: bestDiscount.value,
          },
        ]
      : [];

    return this.mapToResponseDto(product, finalPrice, appliedDiscounts);
  }

  private mapToResponseDto(
    product: Product,
    finalPrice: number,
    appliedDiscounts: Array<{
      id: string;
      name: string;
      discountType: string;
      value: number;
    }>,
  ): ProductResponseDto {
    return {
      id: product.id || product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: product.basePrice,
      categoryId: product.categoryId.toString(),
      sku: product.sku,
      images: product.images,
      metadata: product.metadata,
      finalPrice,
      appliedDiscounts: appliedDiscounts.length > 0 ? appliedDiscounts : undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
