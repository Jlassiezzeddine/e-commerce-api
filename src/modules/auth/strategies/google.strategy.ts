import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clientId = configService.get<string>('google.clientId') || process.env.GOOGLE_CLIENT_ID;
    const clientSecret =
      configService.get<string>('google.clientSecret') || process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL =
      configService.get<string>('google.callbackURL') || process.env.GOOGLE_CALLBACK_URL;

    // Use dummy values if credentials are not provided to prevent OAuth2Strategy error
    // These won't work for actual OAuth, but allow the app to start without Google OAuth configured
    super({
      clientID: clientId || 'dummy-client-id',
      clientSecret: clientSecret || 'dummy-client-secret',
      callbackURL: callbackURL || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: Array<{ value?: string }>;
      displayName?: string;
      photos?: Array<{ value?: string }>;
    },
    done: VerifyCallback,
  ): Promise<{
    provider: string;
    providerId: string;
    email?: string;
    name?: string;
    avatar?: string;
    accessToken: string;
  }> {
    const { id, emails, displayName, photos } = profile;
    const user = {
      provider: 'google',
      providerId: id,
      email: emails?.[0]?.value,
      name: displayName,
      avatar: photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
    return user;
  }
}
