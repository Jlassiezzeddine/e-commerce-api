import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { DatabaseException } from '../../common/exceptions/database.exception';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';
import { UserRepository } from '../../database/repositories/user.repository';
import { User } from '../../database/schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import {
  UserConflictException,
  UserNotFoundException,
  UserOperationException,
} from './exceptions/user.exceptions';

@Injectable()
export class UsersService {
  private readonly saltRounds: number;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {
    this.saltRounds = this.configService.get<number>('security.bcryptSaltRounds', 10);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.userRepository.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new UserConflictException('email', createUserDto.email);
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, this.saltRounds);

      const user = await this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
        email: createUserDto.email.toLowerCase(),
      });

      return user;
    } catch (error) {
      if (error instanceof UserConflictException) {
        throw error;
      }
      throw new DatabaseException('Failed to create user', ErrorCode.DB_004, {
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
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { data, total } = await this.userRepository.findWithPagination(
      {},
      page,
      limit,
      sortBy,
      sortOrder,
    );

    return {
      data: data.map((user) => this.mapToResponseDto(user)),
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

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new UserNotFoundException(id, 'id');
      }
      return user;
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      // Handle CastError (invalid ObjectId format) as UserNotFoundException
      if (
        error instanceof Error &&
        (error.name === 'CastError' || error.message?.includes('Cast to ObjectId'))
      ) {
        throw new UserNotFoundException(id, 'id');
      }
      throw new DatabaseException('Failed to find user', ErrorCode.DB_004, {
        userId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      await this.findOne(id); // Verify user exists

      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, this.saltRounds);
      }

      const updated = await this.userRepository.update(id, updateUserDto);
      if (!updated) {
        throw new UserOperationException('update', { userId: id });
      }

      return updated;
    } catch (error) {
      if (error instanceof UserNotFoundException || error instanceof UserOperationException) {
        throw error;
      }
      throw new DatabaseException('Failed to update user', ErrorCode.DB_004, {
        userId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      const deleted = await this.userRepository.delete(id);
      if (!deleted) {
        throw new UserOperationException('delete', { userId: id });
      }
    } catch (error) {
      if (error instanceof UserNotFoundException || error instanceof UserOperationException) {
        throw error;
      }
      throw new DatabaseException('Failed to delete user', ErrorCode.DB_004, {
        userId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private mapToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id || user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
