import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from '../auth/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  private sanitizeUser(user: User) {
    const {
      password,
      resetToken,
      resetTokenExpiry,
      resetCode,
      resetCodeExpiry,
      verificationToken,
      verificationTokenExpiry,
      verificationCode,
      verificationCodeExpiry,
      ...safe
    } = user;
    return safe;
  }

  private generateRandomPassword() {
    return crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await this.userRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return {
      data: users.map((user) => this.sanitizeUser(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.sanitizeUser(user);
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.userRepo.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const randomPassword = this.generateRandomPassword();
    const user = this.userRepo.create({
      ...createUserDto,
      password: randomPassword,
      isActive: true,
    });
    const saved = await this.userRepo.save(user);

    let resetInfo: any = null;
    try {
      resetInfo = await this.authService.forgotPassword({
        email: saved.email,
      });
    } catch (error: any) {
      resetInfo = {
        message: 'User created, but reset email failed to send.',
        error: error?.message || 'Reset email failed.',
      };
    }

    return {
      user: this.sanitizeUser(saved),
      reset: resetInfo,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    Object.assign(user, updateUserDto);
    const saved = await this.userRepo.save(user);
    return this.sanitizeUser(saved);
  }

  async remove(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.userRepo.remove(user);
    return { message: `User with ID ${id} has been removed` };
  }
}
