import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryRepository } from '../../database/repositories/category.repository';
import { CategorySchema } from '../../database/schemas/category.schema';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Category', schema: CategorySchema }])],
  controllers: [CategoriesController],
  providers: [CategoryRepository, CategoriesService],
  exports: [CategoryRepository, CategoriesService],
})
export class CategoriesModule {}
