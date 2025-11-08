import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Category } from '../schemas/category.schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class CategoryRepository extends BaseRepository<Category> {
  constructor(@InjectModel('Category') readonly categoryModel: Model<Category>) {
    super(categoryModel);
  }

  async findBySlug(slug: string, session?: ClientSession): Promise<Category | null> {
    return this.findOne({ slug: slug.toLowerCase() }, session);
  }

  async findActive(session?: ClientSession): Promise<Category[]> {
    return this.findAll({ isActive: true }, session);
  }
}
