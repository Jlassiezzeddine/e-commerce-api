import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { AuthService, SocialLoginResponse } from './auth.service';
import { AdminOnly } from './decorators/auth.decorators';
import {
  AuthResponseDto,
  type LoginDto,
  type RefreshTokenDto,
  type RegisterDto,
} from './dto/auth.dto';
import { SendVerificationEmailDto, VerifyEmailDto } from './dto/email-verification.dto';
import {
  OtpVerificationFailureDto,
  OtpVerificationSuccessDto,
  PasswordResetResponseDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  ValidateResetTokenDto,
  VerifyOtpDto,
} from './dto/password-reset.dto';
import { RolesGuard } from './guards/roles.guard';
import { TokenCleanupService } from './services/token-cleanup/token-cleanup.service';

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly tokenCleanupService: TokenCleanupService,
  ) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registering new user with email: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto, res);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Request() req: ExpressRequest) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return { message: 'No token provided', success: false };
    }
    const token = authHeader.replace('Bearer ', '');
    const user = req.user as {
      id: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
    };
    return this.authService.logout(token, user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getCurrentUser(@Request() req) {
    const userId = req.user?.id || req.user?.userId;
    return this.usersService.findOne(userId);
  }

  @Post('admin/cleanup-tokens')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually cleanup expired tokens (Admin only)' })
  @ApiResponse({ status: 200, description: 'Tokens cleaned up successfully' })
  async cleanupExpiredTokens() {
    const deletedCount = await this.tokenCleanupService.cleanupExpiredTokensManually();
    return {
      message: `Successfully cleaned up ${deletedCount} expired tokens`,
      deletedCount,
      success: true,
    };
  }

  @Get('admin/blacklist-stats')
  @AdminOnly()
  @ApiOperation({ summary: 'Get blacklist statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getBlacklistStats() {
    const stats = await this.tokenCleanupService.getBlacklistStats();
    return {
      message: 'Blacklist statistics retrieved successfully',
      stats,
      success: true,
    };
  }

  @Post('request-password-reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
    @Request() req: ExpressRequest,
  ): Promise<PasswordResetResponseDto> {
    const ipAddress = req.ip || (req.connection?.remoteAddress as string) || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    return this.authService.requestPasswordReset(requestPasswordResetDto, ipAddress, userAgent);
  }

  @Post('verify-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for password reset' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOTP(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<OtpVerificationSuccessDto | OtpVerificationFailureDto> {
    return this.authService.verifyOTP(verifyOtpDto);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<PasswordResetResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('validate-reset-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate password reset token' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async validateResetToken(
    @Body() validateResetTokenDto: ValidateResetTokenDto,
  ): Promise<PasswordResetResponseDto> {
    return this.authService.validateResetToken(validateResetTokenDto);
  }

  @Post('send-verification-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async sendVerificationEmail(
    @Body() sendVerificationEmailDto: SendVerificationEmailDto,
    @CurrentUser('email') userEmail?: string,
  ) {
    const email = sendVerificationEmailDto.email || userEmail;
    if (!email) {
      return { message: 'Email is required', success: false };
    }
    return this.authService.sendVerificationEmail(email);
  }

  @Get('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyEmail(
    @Query() verifyEmailDto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyEmail(verifyEmailDto.token, res);
  }

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Initiates Google OAuth2 login
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Request() req, @Res() res: Response): Promise<SocialLoginResponse> {
    // req.user is populated by GoogleStrategy
    return this.authService.handleSocialLogin(req.user, res);
  }
}
