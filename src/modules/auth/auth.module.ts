import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailService } from '../../common/services/email.service';
import { OTPService } from '../../common/services/otp.service';
import { PasswordService } from '../../common/services/password.service';
import { PasswordResetRepository } from '../../database/repositories/password-reset.repository';
import { TokenBlacklistRepository } from '../../database/repositories/token-blacklist.repository';
import { PasswordResetSchema } from '../../database/schemas/password-reset.schema';
import { TokenBlacklistSchema } from '../../database/schemas/token-blacklist.schema';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { AuthRepository } from './repository/auth.repository';
import { JwtAuthService } from './services/jwt/jwt.service';
import { TokenCleanupService } from './services/token-cleanup/token-cleanup.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'TokenBlacklist', schema: TokenBlacklistSchema },
      { name: 'PasswordReset', schema: PasswordResetSchema },
    ]),
    UsersModule,
    PassportModule,
    ScheduleModule.forRoot(),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useFactory: (configService: ConfigService): any => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiration') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    RolesGuard,
    TokenCleanupService,
    EmailService,
    OTPService,
    PasswordService,
    TokenBlacklistRepository,
    PasswordResetRepository,
    {
      provide: 'IAuthRepository',
      useFactory: (
        tokenBlacklistRepo: TokenBlacklistRepository,
        passwordResetRepo: PasswordResetRepository,
      ) => new AuthRepository(tokenBlacklistRepo, passwordResetRepo),
      inject: [TokenBlacklistRepository, PasswordResetRepository],
    },
    {
      provide: 'IAuthService',
      useExisting: AuthService,
    },
  ],
  exports: [AuthService, JwtAuthService, RolesGuard, TokenCleanupService],
})
export class AuthModule {}
