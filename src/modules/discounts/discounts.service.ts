import { Injectable } from '@nestjs/common';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { DatabaseException } from '../../common/exceptions/database.exception';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';
import { DiscountRepository } from '../../database/repositories/discount.repository';
import { ProductDiscountRepository } from '../../database/repositories/product-discount.repository';
import { Discount } from '../../database/schemas/discount.schema';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { DiscountResponseDto } from './dto/discount-response.dto';
import { LinkDiscountDto } from './dto/link-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import {
  DiscountNotFoundException,
  DiscountOperationException,
  DiscountValidationException,
} from './exceptions/discount.exceptions';

@Injectable()
export class DiscountsService {
  constructor(
    private readonly discountRepository: DiscountRepository,
    private readonly productDiscountRepository: ProductDiscountRepository,
  ) {}

  async create(createDiscountDto: CreateDiscountDto): Promise<Discount> {
    try {
      if (createDiscountDto.code) {
        const existing = await this.discountRepository.findByCode(createDiscountDto.code);
        if (existing) {
          throw new DiscountValidationException('Discount with this code already exists', {
            field: 'code',
            value: createDiscountDto.code,
          });
        }
      }

      const startDate = new Date(createDiscountDto.startDate);
      const endDate = new Date(createDiscountDto.endDate);

      if (startDate >= endDate) {
        throw new DiscountValidationException('End date must be after start date', {
          startDate,
          endDate,
        });
      }

      return await this.discountRepository.create({
        ...createDiscountDto,
        code: createDiscountDto.code?.toUpperCase(),
        startDate,
        endDate,
      });
    } catch (error) {
      if (error instanceof DiscountValidationException) {
        throw error;
      }
      throw new DatabaseException('Failed to create discount', ErrorCode.DB_004, {
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
  ): Promise<PaginatedResponseDto<DiscountResponseDto>> {
    const { data, total } = await this.discountRepository.findWithPagination(
      {},
      page,
      limit,
      sortBy,
      sortOrder,
    );

    return {
      data: data.map((discount) => this.mapToResponseDto(discount)),
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

  async findActive(): Promise<DiscountResponseDto[]> {
    const discounts = await this.discountRepository.findActiveDiscounts();
    return discounts.map((discount) => this.mapToResponseDto(discount));
  }

  async findOne(id: string): Promise<Discount> {
    try {
      const discount = await this.discountRepository.findById(id);
      if (!discount) {
        throw new DiscountNotFoundException(id);
      }
      return discount;
    } catch (error) {
      if (error instanceof DiscountNotFoundException) {
        throw error;
      }
      // Handle CastError (invalid ObjectId format) as DiscountNotFoundException
      if (
        error instanceof Error &&
        (error.name === 'CastError' || error.message?.includes('Cast to ObjectId'))
      ) {
        throw new DiscountNotFoundException(id);
      }
      throw new DatabaseException('Failed to find discount', ErrorCode.DB_004, {
        discountId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findByCode(code: string): Promise<Discount> {
    try {
      const discount = await this.discountRepository.findByCode(code);
      if (!discount) {
        throw new DiscountNotFoundException();
      }
      return discount;
    } catch (error) {
      if (error instanceof DiscountNotFoundException) {
        throw error;
      }
      throw new DatabaseException('Failed to find discount by code', ErrorCode.DB_004, {
        code,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async update(id: string, updateDiscountDto: UpdateDiscountDto): Promise<Discount> {
    try {
      await this.findOne(id);

      if (updateDiscountDto.code) {
        const existing = await this.discountRepository.findByCode(updateDiscountDto.code);
        if (existing && existing.id !== id) {
          throw new DiscountValidationException('Discount with this code already exists', {
            field: 'code',
            value: updateDiscountDto.code,
          });
        }
        updateDiscountDto.code = updateDiscountDto.code.toUpperCase();
      }

      if (updateDiscountDto.startDate && updateDiscountDto.endDate) {
        const startDate = new Date(updateDiscountDto.startDate);
        const endDate = new Date(updateDiscountDto.endDate);
        if (startDate >= endDate) {
          throw new DiscountValidationException('End date must be after start date', {
            startDate,
            endDate,
          });
        }
      }

      const updated = await this.discountRepository.update(id, updateDiscountDto as never);
      if (!updated) {
        throw new DiscountOperationException('update', { discountId: id });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof DiscountNotFoundException ||
        error instanceof DiscountValidationException ||
        error instanceof DiscountOperationException
      ) {
        throw error;
      }
      throw new DatabaseException('Failed to update discount', ErrorCode.DB_004, {
        discountId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      const deleted = await this.discountRepository.delete(id);
      if (!deleted) {
        throw new DiscountOperationException('delete', { discountId: id });
      }
    } catch (error) {
      if (
        error instanceof DiscountNotFoundException ||
        error instanceof DiscountOperationException
      ) {
        throw error;
      }
      throw new DatabaseException('Failed to delete discount', ErrorCode.DB_004, {
        discountId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async linkToProduct(linkDiscountDto: LinkDiscountDto): Promise<void> {
    const _discount = await this.findOne(linkDiscountDto.discountId);

    await this.productDiscountRepository.linkProductToDiscount(
      linkDiscountDto.productId,
      linkDiscountDto.discountId,
      linkDiscountDto.productItemId,
    );
  }

  async unlinkFromProduct(productId: string, discountId: string): Promise<void> {
    try {
      const unlinked = await this.productDiscountRepository.unlinkProductFromDiscount(
        productId,
        discountId,
      );
      if (!unlinked) {
        throw new DiscountNotFoundException();
      }
    } catch (error) {
      if (error instanceof DiscountNotFoundException) {
        throw error;
      }
      throw new DatabaseException('Failed to unlink discount from product', ErrorCode.DB_004, {
        productId,
        discountId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getProductsByDiscount(discountId: string) {
    await this.findOne(discountId);
    return this.productDiscountRepository.findByDiscount(discountId);
  }

  private mapToResponseDto(discount: Discount): DiscountResponseDto {
    return {
      id: discount.id || discount._id.toString(),
      code: discount.code,
      name: discount.name,
      description: discount.description,
      discountType: discount.discountType,
      value: discount.value,
      startDate: discount.startDate,
      endDate: discount.endDate,
      isActive: discount.isActive,
      minimumOrderValue: discount.minimumOrderValue,
      minimumQuantity: discount.minimumQuantity,
      maxUsageCount: discount.maxUsageCount,
      usageCount: discount.usageCount,
      createdAt: discount.createdAt,
      updatedAt: discount.updatedAt,
    };
  }
}
