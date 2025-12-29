import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  @InjectRepository(User)
  private readonly userRepo: Repository<User>;
  constructor(private readonly emailService: EmailService) {}

  private generateRandomPassword() {
    return crypto.randomBytes(6).toString('base64url').slice(0, 12);
  }

  private generateSixDigitCode(): string {
    const code = crypto.randomInt(0, 1000000);
    return code.toString().padStart(6, '0');
  }

  create(createUserDto: Partial<User>) {
    return this.userRepo.save(createUserDto);
  }

  async createWithInvite(createUserDto: Partial<User>) {
    const email = (createUserDto.email || '').trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const name = (createUserDto.name || '').trim();
    const lastName = (createUserDto.lastName || '').trim();
    const role = createUserDto.role || 'agent';

    const existing = await this.findOneByEmail(email);
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const password = this.generateRandomPassword();
    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = this.userRepo.create({
      ...createUserDto,
      email,
      name,
      lastName,
      role,
      password: hashedPassword,
      emailVerified: true,
      isActive: createUserDto.isActive ?? true,
    });

    // Persist user first
    await this.userRepo.save(user);

    // Prepare reset flow so the user sets their own password
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const resetCode = this.generateSixDigitCode();
    const resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;

    await this.userRepo.save(user);

    return {
      message:
        'User created. Share the reset code so the user can set their password via forgot-password.',
      email: user.email,
      reset: { resetCode },
    };
  }

  findOneByEmail(email: string) {
    return this.userRepo.findOneBy({ email });
  }

  findAll() {
    return this.userRepo.find();
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  findOneByResetToken(resetToken: string) {
    return this.userRepo.findOne({
      where: { resetToken },
    });
  }

  findOneByVerificationToken(verificationToken: string) {
    return this.userRepo.findOne({
      where: { verificationToken },
    });
  }

  save(user: User) {
    return this.userRepo.save(user);
  }

  async blockUser(id: number, isActive: boolean) {
    const user = await this.findOne(id);
    user.isActive = isActive;
    return this.userRepo.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepo.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
    return { message: 'User removed successfully' };
  }
}
