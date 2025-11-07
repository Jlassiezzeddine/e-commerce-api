import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { CategoryRepository } from '../../database/repositories/category.repository';
import { Category } from '../../database/schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existingByName = await this.categoryRepository.findOne({ name: createCategoryDto.name });
    if (existingByName) {
      throw new ConflictException('Category with this name already exists');
    }

    const existingBySlug = await this.categoryRepository.findBySlug(createCategoryDto.slug);
    if (existingBySlug) {
      throw new ConflictException('Category with this slug already exists');
    }

    return this.categoryRepository.create({
      ...createCategoryDto,
      slug: createCategoryDto.slug.toLowerCase(),
    });
  }

  async findAll(
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Promise<PaginatedResponseDto<CategoryResponseDto>> {
    const { data, total } = await this.categoryRepository.findWithPagination(
      {},
      page,
      limit,
      sortBy,
      sortOrder,
    );

    return {
      data: data.map((category) => this.mapToResponseDto(category)),
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

  async findActive(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findActive();
    return categories.map((category) => this.mapToResponseDto(category));
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id); // Verify category exists

    // Check for conflicts if name or slug is being updated
    if (updateCategoryDto.name) {
      const existingByName = await this.categoryRepository.findOne({ name: updateCategoryDto.name });
      const existingId = existingByName?.id || existingByName?._id?.toString();
      if (existingByName && existingId !== id) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    if (updateCategoryDto.slug) {
      const existingBySlug = await this.categoryRepository.findBySlug(updateCategoryDto.slug);
      const existingId = existingBySlug?.id || existingBySlug?._id?.toString();
      if (existingBySlug && existingId !== id) {
        throw new ConflictException('Category with this slug already exists');
      }
      updateCategoryDto.slug = updateCategoryDto.slug.toLowerCase();
    }

    const updated = await this.categoryRepository.update(id, updateCategoryDto);
    if (!updated) {
      throw new BadRequestException('Failed to update category');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify category exists
    const deleted = await this.categoryRepository.delete(id);
    if (!deleted) {
      throw new BadRequestException('Failed to delete category');
    }
  }

  private mapToResponseDto(category: Category): CategoryResponseDto {
    return {
      id: category.id || category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}

