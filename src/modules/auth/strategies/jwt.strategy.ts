import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { TokenPayloadDto } from '../dto/auth.dto';
import { InvalidTokenException } from '../exceptions/auth.exceptions';
import { IAuthRepository } from '../repository/auth.repository.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
      passReqToCallback: true, // This allows us to access the request
    });
  }

  async validate(
    request: { headers: { authorization?: string; Authorization?: string } },
    payload: TokenPayloadDto,
  ) {
    // Extract token from request to check blacklist
    const token = this.extractTokenFromRequest(request);

    if (token) {
      const isBlacklisted = await this.authRepository.isTokenBlacklisted(token);
      if (isBlacklisted) {
        this.logger.error('Token is blacklisted');
        throw new InvalidTokenException();
      }
    }

    const user = await this.usersService.findByEmail(payload.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token or user inactive');
    }

    return {
      id: user.id || user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  private extractTokenFromRequest(request: {
    headers: { authorization?: string; Authorization?: string };
  }): string | null {
    const authHeader = request.headers.authorization || request.headers.Authorization;
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.replace('Bearer ', '');
  }
}
