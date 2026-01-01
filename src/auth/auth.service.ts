import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { registerDto } from './dto/register.dto';
import * as bcryptjs from 'bcryptjs';
import { loginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  private generateSixDigitCode(): string {
    const code = crypto.randomInt(0, 1000000);
    return code.toString().padStart(6, '0');
  }

  async register(registerDto: registerDto) {
    const user = await this.usersService.findOneByEmail(registerDto.email);
    if (user) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcryptjs.hash(registerDto.password, 10);

    const createdUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      emailVerified: true,
      verificationToken: undefined,
      verificationTokenExpiry: undefined,
      verificationCode: undefined,
      verificationCodeExpiry: undefined,
    });

    // fire-and-forget welcome email
    try {
      await this.emailService.sendWelcomeEmail(
        registerDto.email,
        `${registerDto.name} ${registerDto.lastName}`.trim(),
      );
    } catch (error) {
      this.logger.warn(
        `User registered but failed to send welcome email to ${registerDto.email}: ${error}`,
      );
    }

    return {
      message: 'User registered successfully.',
      email: createdUser.email,
    };
  }

  async login(loginDto: loginDto) {
    const user = await this.usersService.findOneByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcryptjs.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is blocked');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('Email not found');
    }

    this.logger.log(`Password reset requested for ${email}`);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const resetCode = this.generateSixDigitCode();
    const resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;

    await this.usersService.save(user);

    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetCode,
      `${user.name} ${user.lastName}`,
    );

    return {
      message: 'Password reset code sent to your email',
      resetToken:
        process.env.NODE_ENV === 'development' ? resetToken : undefined,
      resetCode: process.env.NODE_ENV === 'development' ? resetCode : undefined,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, email, code, newPassword } = resetPasswordDto;
    let user: User | null = null;

    if (token) {
      user = await this.usersService.findOneByResetToken(token);
      if (
        !user ||
        !user.resetTokenExpiry ||
        user.resetTokenExpiry < new Date()
      ) {
        throw new BadRequestException('Invalid or expired token');
      }
    } else {
      if (!email || !code) {
        throw new BadRequestException('Email and code are required');
      }

      user = await this.usersService.findOneByEmail(email);

      if (
        !user ||
        !user.resetCodeExpiry ||
        user.resetCodeExpiry < new Date()
      ) {
        throw new BadRequestException('Invalid or expired code');
      }

      if (user.resetCode !== code) {
        throw new BadRequestException('Invalid or expired code');
      }
    }

    if (!user) {
      throw new BadRequestException('Invalid or expired reset request');
    }

    user.password = await bcryptjs.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;

    await this.usersService.save(user);

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.usersService.findOneByVerificationToken(
      verifyEmailDto.token,
    );

    if (
      !user ||
      !user.verificationTokenExpiry ||
      user.verificationTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;

    await this.usersService.save(user);

    return { message: 'Email verified successfully. You can now login.' };
  }

  async verifyEmailWithCode(verifyEmailCodeDto: VerifyEmailCodeDto) {
    const { email, code } = verifyEmailCodeDto;
    const user = await this.usersService.findOneByEmail(email);

    if (
      !user ||
      !user.verificationCodeExpiry ||
      user.verificationCodeExpiry < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;

    await this.usersService.save(user);

    return { message: 'Email verified successfully. You can now login.' };
  }

  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto) {
    const { email, code } = verifyResetCodeDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !user.resetCodeExpiry || user.resetCodeExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired code');
    }

    if (user.resetCode !== code) {
      throw new BadRequestException('Invalid or expired code');
    }

    return { message: 'Code verified successfully.' };
  }

  async profile(email: string, role: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
    };
  }

  async updateProfile(
    email: string,
    updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updated = await this.usersService.update(user.id, {
      name: updateProfileDto.name ?? user.name,
      lastName: updateProfileDto.lastName ?? user.lastName,
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      lastName: updated.lastName,
      role: updated.role,
      isActive: updated.isActive,
      emailVerified: updated.emailVerified,
    };
  }
}
