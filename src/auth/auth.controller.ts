import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerDto } from './dto/register.dto';
import { loginDto } from './dto/login.dto';
import { Request } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { AuthGuard } from './guard/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

interface RequestWithUser extends Request {
  user: { sub: string; email: string; role: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  register(
    @Body()
    registerDto: registerDto,
  ) {
    return this.authService.register(registerDto);
  }
  @Post('login')
  login(
    @Body()
    loginDto: loginDto,
  ) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  forgotPassword(
    @Body()
    forgotPasswordDto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  resetPassword(
    @Body()
    resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('verify-email')
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('verify-email-code')
  verifyEmailCode(@Body() verifyEmailCodeDto: VerifyEmailCodeDto) {
    return this.authService.verifyEmailWithCode(verifyEmailCodeDto);
  }

  @Post('verify-reset-code')
  verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(verifyResetCodeDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  profile(@Req() req: RequestWithUser) {
    return this.authService.profile(req.user.email, req.user.role);
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.email, updateProfileDto);
  }
}
