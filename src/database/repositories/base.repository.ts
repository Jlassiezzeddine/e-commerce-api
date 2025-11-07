import type { ClientSession, FilterQuery, Model, UpdateQuery } from 'mongoose';
import type { BaseRepositoryInterface } from '../interfaces/base-repository.interface';

export abstract class BaseRepository<T> implements BaseRepositoryInterface<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const created = new this.model(data);
    const saved = await created.save({ session });
    return saved.toObject() as T;
  }

  async findById(id: string, session?: ClientSession): Promise<T | null> {
    const result = await this.model
      .findById(id)
      .session(session || null)
      .lean()
      .exec();
    return result as T | null;
  }

  async findOne(filter: FilterQuery<T>, session?: ClientSession): Promise<T | null> {
    const result = await this.model
      .findOne(filter)
      .session(session || null)
      .lean()
      .exec();
    return result as T | null;
  }

  async findAll(filter: FilterQuery<T> = {}, session?: ClientSession): Promise<T[]> {
    const results = await this.model
      .find(filter)
      .session(session || null)
      .lean()
      .exec();
    return results as T[];
  }

  async findWithPagination(
    filter: FilterQuery<T>,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    session?: ClientSession,
  ): Promise<{ data: T[]; total: number }> {
    const skip = (page - 1) * limit;
    const effectiveSortBy = sortBy || 'createdAt';
    const effectiveSortOrder = sortOrder || 'desc';
    const sortValue: 1 | -1 = effectiveSortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ [effectiveSortBy]: sortValue } as Record<string, 1 | -1>)
        .skip(skip)
        .limit(limit)
        .session(session || null)
        .lean()
        .exec(),
      this.model
        .countDocuments(filter)
        .session(session || null)
        .exec(),
    ]);

    return {
      data: data as T[],
      total,
    };
  }

  async update(id: string, data: UpdateQuery<T>, session?: ClientSession): Promise<T | null> {
    const result = await this.model
      .findByIdAndUpdate(id, data, { new: true, session })
      .lean()
      .exec();
    return result as T | null;
  }

  async delete(id: string, session?: ClientSession): Promise<boolean> {
    const result = await this.model
      .findByIdAndDelete(id)
      .session(session || null)
      .exec();
    return result !== null;
  }
  async deleteMany(filter: FilterQuery<T> = {}, session?: ClientSession): Promise<boolean> {
    const result = await this.model.deleteMany(filter, { session: session || null });
    return result.acknowledged;
  }

  async count(filter: FilterQuery<T> = {}, session?: ClientSession): Promise<number> {
    return this.model
      .countDocuments(filter)
      .session(session || null)
      .exec();
  }
}
