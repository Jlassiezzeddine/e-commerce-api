import { ClientSession, FilterQuery, UpdateQuery } from 'mongoose';

export interface BaseRepositoryInterface<T> {
  create(data: Partial<T>, session?: ClientSession): Promise<T>;
  findById(id: string, session?: ClientSession): Promise<T | null>;
  findOne(filter: FilterQuery<T>, session?: ClientSession): Promise<T | null>;
  findAll(filter?: FilterQuery<T>, session?: ClientSession): Promise<T[]>;
  findWithPagination(
    filter: FilterQuery<T>,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    session?: ClientSession,
  ): Promise<{ data: T[]; total: number }>;
  update(id: string, data: UpdateQuery<T>, session?: ClientSession): Promise<T | null>;
  delete(id: string, session?: ClientSession): Promise<boolean>;
  deleteMany(filter?: FilterQuery<T>, session?: ClientSession): Promise<boolean>;
  count(filter?: FilterQuery<T>, session?: ClientSession): Promise<number>;
}
