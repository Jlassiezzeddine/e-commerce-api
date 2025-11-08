import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { EmailService } from '../../common/services/email.service';
import { OTPService } from '../../common/services/otp.service';
import { PasswordService } from '../../common/services/password.service';
import { UserRepository } from '../../database/repositories/user.repository';
import { type User, UserRole } from '../../database/schemas/user.schema';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersService } from '../users/users.service';
import { AuthResponseDto, LoginDto, RegisterDto, TokenPayloadDto } from './dto/auth.dto';
import {
  OtpVerificationFailureDto,
  OtpVerificationSuccessDto,
  PasswordResetResponseDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  ValidateResetTokenDto,
  VerifyOtpDto,
} from './dto/password-reset.dto';
import {
  InvalidCredentialsException,
  InvalidVerificationTokenException,
  UserAlreadyVerifiedException,
} from './exceptions/auth.exceptions';

interface SocialUser {
  provider: string;
  providerId: string;
  email?: string;
  name?: string;
  avatar?: string;
  accessToken: string;
}

export interface SocialLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
    provider?: string;
    providerId?: string;
  };
  isNewUser: boolean;
  message: string;
}

import { IAuthRepository } from './repository/auth.repository.interface';
import { JwtAuthService } from './services/jwt/jwt.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('IAuthRepository') private readonly authRepository: IAuthRepository,
    private readonly jwtAuthService: JwtAuthService,
    private readonly emailService: EmailService,
    private readonly otpService: OTPService,
    private readonly passwordService: PasswordService,
  ) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('app.nodeEnv') === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('app.nodeEnv') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  async validateUser(email: string, password: string): Promise<User> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new InvalidCredentialsException();
      }

      const isPasswordValid = await this.passwordService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new InvalidCredentialsException();
      }

      return user;
    } catch (_error) {
      throw new InvalidCredentialsException();
    }
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create(registerDto);
    await this.sendVerificationEmail(user.email);

    const tokens = await this.generateTokens(user.id || user._id.toString(), user.email, user.role);

    await this.userRepository.updateRefreshToken(
      user.id || user._id.toString(),
      tokens.refreshToken,
    );

    return {
      user: {
        id: user.id || user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(loginDto: LoginDto, res: Response): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const payload: TokenPayloadDto = {
      sub: user.id || user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtAuthService.generateAccessToken(payload);
    const refreshToken = this.jwtAuthService.generateRefreshToken(payload);

    this.setAuthCookies(res, accessToken, refreshToken);

    await this.userRepository.updateRefreshToken(user.id || user._id.toString(), refreshToken);
    await this.userRepository.updateLastLogin(user.id || user._id.toString());

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id || user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: new Date(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async refreshToken(refreshToken: string, res: Response): Promise<AuthResponseDto> {
    const payload = this.jwtAuthService.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findByEmail(payload.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token or user inactive');
    }

    const docId = user.id || user._id.toString();
    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newPayload: TokenPayloadDto = {
      sub: docId,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = this.jwtAuthService.generateAccessToken(newPayload);
    const newRefreshToken = this.jwtAuthService.generateRefreshToken(newPayload);

    this.setAuthCookies(res, newAccessToken, newRefreshToken);

    await this.userRepository.updateRefreshToken(docId, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: docId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async logout(
    token: string,
    user: { id: string; email: string; role: string },
  ): Promise<{ message: string; success: boolean }> {
    try {
      // Decode the token to get expiry time
      const decoded = this.jwtService.decode(token) as TokenPayloadDto & { exp?: number };
      if (!decoded || !decoded.exp) {
        return {
          message: 'Invalid token format',
          success: false,
        };
      }

      // Convert expiry timestamp to Date
      const expiresAt = new Date(decoded.exp * 1000);

      // Blacklist the token
      await this.authRepository.blacklistToken(token, user.id, expiresAt, 'logout');

      // Clear refresh token
      await this.userRepository.updateRefreshToken(user.id, null);

      return {
        message: 'Successfully logged out',
        success: true,
      };
    } catch (error) {
      this.logger.error('Error during logout:', error);
      return {
        message: 'Error during logout',
        success: false,
      };
    }
  }

  async sendVerificationEmail(email: string): Promise<{ message: string; success: boolean }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    if (user.emailVerified) {
      throw new UserAlreadyVerifiedException();
    }

    const userId = user.id || user._id.toString();
    const verificationToken = this.jwtAuthService.generateVerificationToken(userId);

    const emailSent = await this.emailService.sendAccountVerificationEmail(
      email,
      verificationToken,
      `${user.firstName} ${user.lastName}`,
    );

    if (!emailSent) {
      throw new BadRequestException('Failed to send verification email. Please try again later.');
    }

    return {
      message: 'Verification email sent successfully.',
      success: true,
    };
  }

  async verifyEmail(
    token: string,
    res: Response,
  ): Promise<{ accessToken: string; refreshToken: string; user: UserResponseDto }> {
    try {
      const payload = this.jwtAuthService.verifyVerificationToken(token);
      const user = await this.usersService.findOne(payload.sub);
      const docId = user.id || user._id.toString();

      await this.userRepository.update(docId, { emailVerified: true });

      const tokenPayload: TokenPayloadDto = {
        sub: docId,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtAuthService.generateAccessToken(tokenPayload);
      const refreshToken = this.jwtAuthService.generateRefreshToken(tokenPayload);

      this.setAuthCookies(res, accessToken, refreshToken);
      await this.userRepository.updateRefreshToken(docId, refreshToken);

      return {
        accessToken,
        refreshToken,
        user: {
          id: docId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (_error) {
      throw new InvalidVerificationTokenException();
    }
  }

  async requestPasswordReset(
    data: RequestPasswordResetDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<PasswordResetResponseDto> {
    try {
      const user = await this.usersService.findByEmail(data.email);
      if (!user) {
        // Return success even if user doesn't exist for security reasons
        this.logger.warn(`Password reset requested for non-existent email: ${data.email}`);
        return {
          message: 'If an account with this email exists, a password reset link has been sent.',
          success: true,
        };
      }

      // Generate OTP
      const otp = this.otpService.generateOTP(data.email);

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Create password reset record
      await this.authRepository.createPasswordReset(
        user.id || user._id.toString(),
        data.email,
        resetToken,
        expiresAt,
        ipAddress,
        userAgent,
      );

      // Send email
      const emailSent = await this.emailService.sendPasswordResetEmail(
        data.email,
        otp,
        resetToken,
        `${user.firstName} ${user.lastName}`,
      );

      if (!emailSent) {
        this.logger.error(`Failed to send password reset email to ${data.email}`);
        return {
          message: 'Failed to send password reset email. Please try again later.',
          success: false,
        };
      }

      this.logger.log(
        `Password reset requested for user: ${user.id || user._id.toString()} (${data.email})`,
      );
      return {
        message: 'Password reset email sent successfully.',
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error requesting password reset for ${data.email}:`, error);
      return {
        message: 'An error occurred while processing your request. Please try again later.',
        success: false,
      };
    }
  }

  async verifyOTP(
    data: VerifyOtpDto,
  ): Promise<OtpVerificationSuccessDto | OtpVerificationFailureDto> {
    try {
      const validation = this.otpService.validateOTP(data.email, data.otp);

      if (!validation.isValid) {
        return {
          message: validation.message,
          success: false,
        };
      }

      // Find the password reset record
      const passwordReset = await this.authRepository.findPasswordResetByEmail(data.email);
      if (!passwordReset) {
        return {
          message: 'No password reset request found for this email.',
          success: false,
        };
      }

      if (passwordReset.isUsed) {
        return {
          message: 'This password reset has already been used.',
          success: false,
        };
      }

      if (passwordReset.expiresAt < new Date()) {
        return {
          message: 'Password reset link has expired.',
          success: false,
        };
      }

      this.logger.log(`OTP verified for password reset: ${data.email}`);
      return {
        message: 'OTP verified successfully.',
        success: true,
        resetToken: passwordReset.token,
        expiresAt: passwordReset.expiresAt,
      };
    } catch (error) {
      this.logger.error(`Error verifying OTP for ${data.email}:`, error);
      return {
        message: 'An error occurred while verifying OTP. Please try again.',
        success: false,
      };
    }
  }

  async resetPassword(data: ResetPasswordDto): Promise<PasswordResetResponseDto> {
    try {
      // Validate password confirmation
      if (data.password !== data.confirmPassword) {
        return {
          message: 'Passwords do not match.',
          success: false,
        };
      }

      // Find password reset record
      const passwordReset = await this.authRepository.findPasswordResetByToken(data.resetToken);
      if (!passwordReset) {
        return {
          message: 'Invalid or expired reset token.',
          success: false,
        };
      }

      if (passwordReset.isUsed) {
        return {
          message: 'This reset token has already been used.',
          success: false,
        };
      }

      if (passwordReset.expiresAt < new Date()) {
        return {
          message: 'Reset token has expired.',
          success: false,
        };
      }

      // Get user
      const user = await this.usersService.findOne(passwordReset.userId);
      if (!user) {
        return {
          message: 'User not found.',
          success: false,
        };
      }

      // Update password
      const hashedPassword = await this.passwordService.hashPassword(data.password);
      await this.userRepository.update(passwordReset.userId, {
        password: hashedPassword,
      });

      // Mark reset token as used
      await this.authRepository.markPasswordResetAsUsed(data.resetToken);

      // Invalidate OTP
      this.otpService.invalidateOTP(passwordReset.email);

      // Send success email (non-critical, so we don't fail if it doesn't send)
      const emailSent = await this.emailService.sendPasswordResetSuccessEmail(
        passwordReset.email,
        `${user.firstName} ${user.lastName}`,
      );

      if (!emailSent) {
        this.logger.warn(`Failed to send password reset success email to ${passwordReset.email}`);
      }

      this.logger.log(
        `Password reset successful for user: ${passwordReset.userId} (${passwordReset.email})`,
      );
      return {
        message: 'Password reset successfully. You can now log in with your new password.',
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error resetting password:`, error);
      return {
        message: 'An error occurred while resetting your password. Please try again.',
        success: false,
      };
    }
  }

  async validateResetToken(data: ValidateResetTokenDto): Promise<PasswordResetResponseDto> {
    try {
      const passwordReset = await this.authRepository.findPasswordResetByToken(data.resetToken);

      if (!passwordReset) {
        return {
          message: 'Invalid reset token.',
          success: false,
        };
      }

      if (passwordReset.isUsed) {
        return {
          message: 'This reset token has already been used.',
          success: false,
        };
      }

      if (passwordReset.expiresAt < new Date()) {
        return {
          message: 'Reset token has expired.',
          success: false,
        };
      }

      return {
        message: 'Reset token is valid.',
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error validating reset token:`, error);
      return {
        message: 'An error occurred while validating the reset token.',
        success: false,
      };
    }
  }

  async handleSocialLogin(socialUser: SocialUser, res: Response): Promise<SocialLoginResponse> {
    this.logger.log(
      `Processing social login for provider: ${socialUser.provider}, email: ${socialUser.email}`,
    );

    try {
      const { user, isNewUser } = await this.findOrCreateSocialUser(socialUser);

      if (!isNewUser) {
        // Update existing user's provider info and avatar if needed
        await this.updateUserProviderInfo(user, socialUser);
      }

      // Issue JWT tokens
      const userId = user.id || user._id.toString();
      const tokenPayload: TokenPayloadDto = {
        sub: userId,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtAuthService.generateAccessToken(tokenPayload);
      const refreshToken = this.jwtAuthService.generateRefreshToken(tokenPayload);

      this.setAuthCookies(res, accessToken, refreshToken);
      await this.userRepository.updateRefreshToken(userId, refreshToken);

      this.logger.log(
        `Social login successful for user: ${userId}, provider: ${socialUser.provider}, isNewUser: ${isNewUser}`,
      );

      // Prepare response
      const response = {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          provider: user.provider,
          providerId: user.providerId,
        },
        isNewUser,
        message: isNewUser
          ? 'Account created successfully via social login'
          : 'Login successful via social login',
      };

      if (res) {
        res.json(response);
      }
      return response;
    } catch (error: unknown) {
      this.logger.error(
        `Error in social login for provider: ${socialUser.provider}, email: ${socialUser.email}`,
        error,
      );

      if (res) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : 'An error occurred during social login';
        res.status(500).json({
          error: 'Social login failed',
          message: errorMessage,
        });
        // Return a default error response object to satisfy the return type
        return {
          accessToken: '',
          refreshToken: '',
          user: {
            id: '',
            email: '',
            firstName: '',
            lastName: '',
            role: '',
          },
          isNewUser: false,
          message: errorMessage,
        };
      }
      throw error;
    }
  }

  private async updateUserProviderInfo(user: User, socialUser: SocialUser): Promise<void> {
    const updates: Partial<User> = {};
    if (!user.provider || !user.providerId) {
      updates.provider = socialUser.provider;
      updates.providerId = socialUser.providerId;
    }
    if (socialUser.avatar && user.avatar !== socialUser.avatar) {
      updates.avatar = socialUser.avatar;
    }
    if (Object.keys(updates).length > 0) {
      await this.userRepository.update(user.id || user._id.toString(), updates);
      Object.assign(user, updates);
    }
  }

  private async findOrCreateSocialUser(
    socialUser: SocialUser,
  ): Promise<{ user: User; isNewUser: boolean }> {
    let user: User | null = null;
    let isNewUser = false;

    // Try to find user by email first
    if (socialUser.email) {
      user = await this.usersService.findByEmail(socialUser.email);
      if (user) {
        this.logger.log(`Found existing user by email: ${socialUser.email}`);
      }
    }

    if (!user) {
      // Create new user for social login
      this.logger.log(
        `Creating new user for social login: ${socialUser.provider}, email: ${socialUser.email}`,
      );

      // Validate email is not empty
      if (!socialUser.email) {
        throw new Error('Email is required for social login registration');
      }

      const nameParts = socialUser.name?.split(' ') || ['User', ''];
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      user = await this.usersService.create({
        firstName,
        lastName,
        email: socialUser.email,
        password: randomBytes(32).toString('hex'), // Random password for social users
        role: UserRole.USER,
        emailVerified: true,
        provider: socialUser.provider,
        providerId: socialUser.providerId,
        avatar: socialUser.avatar,
      });
      isNewUser = true;
      this.logger.log(
        `Successfully created new user: ${user.id || user._id.toString()} for social login`,
      );
    }

    return { user, isNewUser };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayloadDto = { sub: userId, email, role };

    const accessToken = this.jwtAuthService.generateAccessToken(payload);
    const refreshToken = this.jwtAuthService.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }
}
