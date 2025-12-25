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

  private generateSixDigitCode(): string {
    const code = crypto.randomInt(0, 1000000);
    return code.toString().padStart(6, '0');
  }

  async register(registerDto: RegisterDto) {
    const { email, name, lastName, password } = registerDto;

    let user: User;
    let verificationToken: string;
    let verificationCode: string;

    try {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      // Generate verification token
      verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours
      verificationCode = this.generateSixDigitCode();
      const verificationCodeExpiry = new Date(Date.now() + 15 * 60000); // 15 minutes

      user = this.userRepository.create({
        name,
        lastName,
        email,
        password,
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry,
        verificationCode,
        verificationCodeExpiry,
      });

      await this.userRepository.save(user);
    } catch (error) {
      // Log the full error for debugging
      console.error('Registration error:', error);
      
      // If it's already a known exception, re-throw it
      if (error instanceof ConflictException) {
        throw error;
      }
      
      // For database errors, provide more context
      if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
        throw new BadRequestException(
          'Database schema error: Missing required columns. Please run the database schema fix script: npm run fix:schema'
        );
      }
      
      // Re-throw with original message
      throw new BadRequestException(
        error.message || 'Failed to register user. Please check the server logs for details.'
      );
    }

    // Send verification email (don't fail registration if email fails)
    try {
      await this.emailService.sendAccountVerificationEmail(
        user.email,
        verificationCode,
        `${user.name} ${user.lastName}`,
      );
    } catch (emailError: any) {
      // Log error but don't fail registration
      console.error('Failed to send verification email:', emailError);
      
      // Check if it's an invalid email address error
      const errorMessage = emailError?.message || '';
      if (errorMessage.includes('does not exist') || 
          errorMessage.includes('NoSuchUser') ||
          errorMessage.includes('550')) {
        // In development, return the token so user can verify manually
        if (process.env.NODE_ENV === 'development') {
          return {
            message: `Usuario registrado exitosamente. Sin embargo, la dirección de email ${user.email} no existe o no puede recibir correos. Por favor verifica que la dirección sea correcta. Puedes verificar manualmente usando el codigo de abajo.`,
            email: user.email,
            verificationCode: verificationCode, // Only in development
            warning: 'La dirección de email proporcionada no existe. Por favor verifica que sea correcta.',
          };
        } else {
          // In production, still return success but warn about email
          return {
            message: `Usuario registrado exitosamente. Sin embargo, no pudimos enviar el correo de verificación a ${user.email}. Por favor verifica que la dirección de email sea correcta y contacta al administrador si necesitas ayuda.`,
            email: user.email,
            warning: 'No se pudo enviar el correo de verificación. Verifica que la dirección de email sea correcta.',
          };
        }
      }
      
      // For other email errors, still return token in development
      if (process.env.NODE_ENV === 'development') {
        return {
          message: 'User registered successfully. Email verification failed, but you can verify manually using the code below.',
          email: user.email,
          verificationCode: verificationCode, // Only in development
        };
      }
    }

    return {
      message: 'User registered successfully. Please check your email for the verification code.',
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
          'If the email exists, you will receive a code to reset your password',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);
    const resetCode = this.generateSixDigitCode();
    const resetCodeExpiry = new Date(Date.now() + 10 * 60000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;
    await this.userRepository.save(user);

    // Enviar email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetCode,
      `${user.name} ${user.lastName}`,
    );

    return {
      message:
        'If the email exists, you will receive a code to reset your password',
      resetToken:
        process.env.NODE_ENV === 'development' ? resetToken : undefined,
      resetCode:
        process.env.NODE_ENV === 'development' ? resetCode : undefined,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, email, code, newPassword } = resetPasswordDto;
    let user: User | null = null;

    if (token) {
      user = await this.userRepository.findOne({
        where: { resetToken: token },
      });

      if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        throw new BadRequestException('Invalid or expired token');
      }
    } else {
      if (!email || !code) {
        throw new BadRequestException('Email and code are required');
      }

      user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user || !user.resetCodeExpiry || user.resetCodeExpiry < new Date()) {
        throw new BadRequestException('Invalid or expired code');
      }

      if (user.resetCode !== code) {
        throw new BadRequestException('Invalid or expired code');
      }
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
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
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await this.userRepository.save(user);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async verifyEmailWithCode(email: string, code: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || !user.verificationCodeExpiry || user.verificationCodeExpiry < new Date()) {
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
    await this.userRepository.save(user);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async verifyResetCode(email: string, code: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || !user.resetCodeExpiry || user.resetCodeExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired code');
    }

    if (user.resetCode !== code) {
      throw new BadRequestException('Invalid or expired code');
    }

    return {
      message: 'Code verified successfully.',
    };
  }
}
