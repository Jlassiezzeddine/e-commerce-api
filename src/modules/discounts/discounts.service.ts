import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { DiscountRepository } from '../../database/repositories/discount.repository';
import { ProductDiscountRepository } from '../../database/repositories/product-discount.repository';
import type { Discount } from '../../database/schemas/discount.schema';
import type { CreateDiscountDto } from './dto/create-discount.dto';
import type { DiscountResponseDto } from './dto/discount-response.dto';
import type { LinkDiscountDto } from './dto/link-discount.dto';
import type { UpdateDiscountDto } from './dto/update-discount.dto';

@Injectable()
export class DiscountsService {
  constructor(
    private readonly discountRepository: DiscountRepository,
    private readonly productDiscountRepository: ProductDiscountRepository,
  ) {}

  async create(createDiscountDto: CreateDiscountDto): Promise<Discount> {
    if (createDiscountDto.code) {
      const existing = await this.discountRepository.findByCode(createDiscountDto.code);
      if (existing) {
        throw new ConflictException('Discount with this code already exists');
      }
    }

    const startDate = new Date(createDiscountDto.startDate);
    const endDate = new Date(createDiscountDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.discountRepository.create({
      ...createDiscountDto,
      code: createDiscountDto.code?.toUpperCase(),
      startDate,
      endDate,
    });
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
    const discount = await this.discountRepository.findById(id);
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }
    return discount;
  }

  async findByCode(code: string): Promise<Discount> {
    const discount = await this.discountRepository.findByCode(code);
    if (!discount) {
      throw new NotFoundException(`Discount with code ${code} not found`);
    }
    return discount;
  }

  async update(id: string, updateDiscountDto: UpdateDiscountDto): Promise<Discount> {
    const _discount = await this.findOne(id);

    if (updateDiscountDto.code) {
      const existing = await this.discountRepository.findByCode(updateDiscountDto.code);
      if (existing && existing.id !== id) {
        throw new ConflictException('Discount with this code already exists');
      }
      updateDiscountDto.code = updateDiscountDto.code.toUpperCase();
    }

    if (updateDiscountDto.startDate && updateDiscountDto.endDate) {
      const startDate = new Date(updateDiscountDto.startDate);
      const endDate = new Date(updateDiscountDto.endDate);
      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    const updated = await this.discountRepository.update(id, updateDiscountDto as never);
    if (!updated) {
      throw new BadRequestException('Failed to update discount');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const deleted = await this.discountRepository.delete(id);
    if (!deleted) {
      throw new BadRequestException('Failed to delete discount');
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
    const unlinked = await this.productDiscountRepository.unlinkProductFromDiscount(
      productId,
      discountId,
    );
    if (!unlinked) {
      throw new NotFoundException('Product-Discount link not found');
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
