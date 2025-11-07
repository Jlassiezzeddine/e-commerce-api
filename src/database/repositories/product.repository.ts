import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Model } from 'mongoose';
import type { Product } from '../schemas/product.schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(@InjectModel('Product') readonly productModel: Model<Product>) {
    super(productModel);
  }

  async findBySlug(slug: string, session?: ClientSession): Promise<Product | null> {
    return this.findOne({ slug: slug.toLowerCase() }, session);
  }

  async findBySku(sku: string, session?: ClientSession): Promise<Product | null> {
    return this.findOne({ sku: sku.toUpperCase() }, session);
  }

  async findByCategory(categoryId: string, session?: ClientSession): Promise<Product[]> {
    return this.findAll({ categoryId, isActive: true }, session);
  }

  async searchProducts(
    searchTerm: string,
    page: number,
    limit: number,
    session?: ClientSession,
  ): Promise<{ data: Product[]; total: number }> {
    return this.findWithPagination(
      { $text: { $search: searchTerm }, isActive: true },
      page,
      limit,
      'createdAt',
      'desc',
      session,
    );
  }
}
