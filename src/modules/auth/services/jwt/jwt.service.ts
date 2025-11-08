import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { TokenPayloadDto } from '../../dto/auth.dto';
import { InvalidTokenException, TokenExpiredException } from '../../exceptions/auth.exceptions';

@Injectable()
export class JwtAuthService {
  constructor(
    private jwtService: NestJwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(payload: TokenPayloadDto): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiration') || '15m',
    } as any);
  }

  generateRefreshToken(payload: TokenPayloadDto): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiration') || '7d',
    } as any);
  }

  verifyRefreshToken(token: string): TokenPayloadDto {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'TokenExpiredError'
      ) {
        throw new TokenExpiredException();
      }
      throw new InvalidTokenException();
    }
  }

  generateVerificationToken(userId: string): string {
    const payload = { sub: userId };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('jwt.verificationSecret') ||
        this.configService.get<string>('jwt.accessSecret'),
      expiresIn: '1h',
    } as any);
  }

  verifyVerificationToken(token: string): TokenPayloadDto {
    try {
      return this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('jwt.verificationSecret') ||
          this.configService.get<string>('jwt.accessSecret'),
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'TokenExpiredError'
      ) {
        throw new TokenExpiredException();
      }
      throw new InvalidTokenException();
    }
  }
}
