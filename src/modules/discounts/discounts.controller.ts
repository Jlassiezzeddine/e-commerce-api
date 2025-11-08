import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/schemas/user.schema';
import type { DiscountsService } from './discounts.service';
import type { CreateDiscountDto } from './dto/create-discount.dto';
import { DiscountResponseDto } from './dto/discount-response.dto';
import type { LinkDiscountDto } from './dto/link-discount.dto';
import type { UpdateDiscountDto } from './dto/update-discount.dto';

@ApiTags('discounts')
@ApiBearerAuth()
@Controller('discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new discount (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Discount created successfully',
    type: DiscountResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Discount code already exists' })
  async create(@Body() createDiscountDto: CreateDiscountDto): Promise<DiscountResponseDto> {
    const discount = await this.discountsService.create(createDiscountDto);
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

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all discounts with pagination (Admin only)' })
  @ApiResponse({ status: 200, description: 'Discounts retrieved successfully' })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.discountsService.findAll(
      paginationDto.page ?? 1,
      paginationDto.limit ?? 10,
      paginationDto.sortBy,
      paginationDto.sortOrder ?? 'desc',
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active discounts' })
  @ApiResponse({ status: 200, description: 'Active discounts retrieved successfully' })
  async findActive() {
    return this.discountsService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discount by ID' })
  @ApiResponse({ status: 200, description: 'Discount found', type: DiscountResponseDto })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async findOne(@Param('id') id: string): Promise<DiscountResponseDto> {
    const discount = await this.discountsService.findOne(id);
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

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update discount (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Discount updated successfully',
    type: DiscountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ): Promise<DiscountResponseDto> {
    const discount = await this.discountsService.update(id, updateDiscountDto);
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

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete discount (Admin only)' })
  @ApiResponse({ status: 204, description: 'Discount deleted successfully' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.discountsService.remove(id);
  }

  @Post('link')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Link discount to product (Admin only)' })
  @ApiResponse({ status: 201, description: 'Discount linked successfully' })
  async linkToProduct(@Body() linkDiscountDto: LinkDiscountDto): Promise<void> {
    await this.discountsService.linkToProduct(linkDiscountDto);
  }

  @Delete('link/:productId/:discountId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink discount from product (Admin only)' })
  @ApiResponse({ status: 204, description: 'Discount unlinked successfully' })
  async unlinkFromProduct(
    @Param('productId') productId: string,
    @Param('discountId') discountId: string,
  ): Promise<void> {
    await this.discountsService.unlinkFromProduct(productId, discountId);
  }

  @Get(':id/products')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get products by discount (Admin only)' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getProductsByDiscount(@Param('id') id: string) {
    return this.discountsService.getProductsByDiscount(id);
  }
}
