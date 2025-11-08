import { Injectable } from '@nestjs/common';
import type { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { DatabaseException } from '../../common/exceptions/database.exception';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';
import type { CategoryRepository } from '../../database/repositories/category.repository';
import type { Category } from '../../database/schemas/category.schema';
import type { CategoryResponseDto } from './dto/category-response.dto';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CategoryConflictException,
  CategoryNotFoundException,
  CategoryOperationException,
} from './exceptions/category.exceptions';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const existingByName = await this.categoryRepository.findOne({
        name: createCategoryDto.name,
      });
      if (existingByName) {
        throw new CategoryConflictException('name', createCategoryDto.name);
      }

      const existingBySlug = await this.categoryRepository.findBySlug(createCategoryDto.slug);
      if (existingBySlug) {
        throw new CategoryConflictException('slug', createCategoryDto.slug);
      }

      return await this.categoryRepository.create({
        ...createCategoryDto,
        slug: createCategoryDto.slug.toLowerCase(),
      });
    } catch (error) {
      if (error instanceof CategoryConflictException) {
        throw error;
      }
      throw new DatabaseException('Failed to create category', ErrorCode.DB_004, {
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
    try {
      const category = await this.categoryRepository.findById(id);
      if (!category) {
        throw new CategoryNotFoundException(id, 'id');
      }
      return category;
    } catch (error) {
      if (error instanceof CategoryNotFoundException) {
        throw error;
      }
      // Handle CastError (invalid ObjectId format) as CategoryNotFoundException
      if (
        error instanceof Error &&
        (error.name === 'CastError' || error.message?.includes('Cast to ObjectId'))
      ) {
        throw new CategoryNotFoundException(id, 'id');
      }
      throw new DatabaseException('Failed to find category', ErrorCode.DB_004, {
        categoryId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findBySlug(slug: string): Promise<Category> {
    try {
      const category = await this.categoryRepository.findBySlug(slug);
      if (!category) {
        throw new CategoryNotFoundException(slug, 'slug');
      }
      return category;
    } catch (error) {
      if (error instanceof CategoryNotFoundException) {
        throw error;
      }
      throw new DatabaseException('Failed to find category by slug', ErrorCode.DB_004, {
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    try {
      await this.findOne(id); // Verify category exists

      // Check for conflicts if name or slug is being updated
      if (updateCategoryDto.name) {
        const existingByName = await this.categoryRepository.findOne({
          name: updateCategoryDto.name,
        });
        const existingId = existingByName?.id || existingByName?._id?.toString();
        if (existingByName && existingId !== id) {
          throw new CategoryConflictException('name', updateCategoryDto.name);
        }
      }

      if (updateCategoryDto.slug) {
        const existingBySlug = await this.categoryRepository.findBySlug(updateCategoryDto.slug);
        const existingId = existingBySlug?.id || existingBySlug?._id?.toString();
        if (existingBySlug && existingId !== id) {
          throw new CategoryConflictException('slug', updateCategoryDto.slug);
        }
        updateCategoryDto.slug = updateCategoryDto.slug.toLowerCase();
      }

      const updated = await this.categoryRepository.update(id, updateCategoryDto);
      if (!updated) {
        throw new CategoryOperationException('update', { categoryId: id });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof CategoryNotFoundException ||
        error instanceof CategoryConflictException ||
        error instanceof CategoryOperationException
      ) {
        throw error;
      }
      throw new DatabaseException('Failed to update category', ErrorCode.DB_004, {
        categoryId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id); // Verify category exists
      const deleted = await this.categoryRepository.delete(id);
      if (!deleted) {
        throw new CategoryOperationException('delete', { categoryId: id });
      }
    } catch (error) {
      if (
        error instanceof CategoryNotFoundException ||
        error instanceof CategoryOperationException
      ) {
        throw error;
      }
      throw new DatabaseException('Failed to delete category', ErrorCode.DB_004, {
        categoryId: id,
        error: error instanceof Error ? error.message : String(error),
      });
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
