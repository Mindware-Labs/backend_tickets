import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, name, lastName, password } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours

    const user = this.userRepository.create({
      name,
      lastName,
      email,
      password,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    await this.userRepository.save(user);

    // Send verification email (don't fail registration if email fails)
    try {
      await this.emailService.sendAccountVerificationEmail(
        user.email,
        verificationToken,
        `${user.name} ${user.lastName}`,
      );
    } catch (emailError) {
      // Log error but don't fail registration
      console.error('Failed to send verification email:', emailError);
      // In development, return the token so user can verify manually
      if (process.env.NODE_ENV === 'development') {
        return {
          message: 'User registered successfully. Email verification failed, but you can verify manually using the token below.',
          email: user.email,
          verificationToken: verificationToken, // Only in development
          verificationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`,
        };
      }
    }

    return {
      message: 'User registered successfully. Please check your email to verify your account.',
      email: user.email,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in. Check your inbox for the verification link.');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return {
        message:
          'If the email exists, you will receive a link to reset your password',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await this.userRepository.save(user);

    await this.userRepository.save(user);

    // Enviar email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message:
        'If the email exists, you will receive a link to reset your password',
      resetToken:
        process.env.NODE_ENV === 'development' ? resetToken : undefined,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await this.userRepository.save(user);

    return {
      message: 'Password reset successfully',
    };
  }

  async validateUser(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user || !user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await this.userRepository.save(user);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }
}
