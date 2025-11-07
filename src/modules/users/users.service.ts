import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { UserRepository } from '../../database/repositories/user.repository';
import type { User } from '../../database/schemas/user.schema';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UserResponseDto } from './dto/user-response.dto';

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
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, this.saltRounds);

    const user = await this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      email: createUserDto.email.toLowerCase(),
    });

    return user;
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
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id); // Verify user exists

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, this.saltRounds);
    }

    const updated = await this.userRepository.update(id, updateUserDto);
    if (!updated) {
      throw new BadRequestException('Failed to update user');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const _user = await this.findOne(id);
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new BadRequestException('Failed to delete user');
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
