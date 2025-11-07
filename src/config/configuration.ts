const getAppConfig = () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number.parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
});

const getDatabaseConfig = () => ({
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce',
    dbName: process.env.MONGODB_DB_NAME || 'ecommerce',
});

const getJwtConfig = () => ({
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    verificationSecret:
      process.env.JWT_VERIFICATION_SECRET || process.env.JWT_ACCESS_SECRET || 'access-secret',
});

const getGoogleConfig = () => ({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
});

const getEmailConfig = () => ({
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    fromName: process.env.EMAIL_FROM_NAME || 'E-Commerce API',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
});

const getSecurityConfig = () => ({
    bcryptSaltRounds: Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
});

const getLoggingConfig = () => ({
    level: process.env.LOG_LEVEL || 'debug',
});

export default () => ({
  app: getAppConfig(),
  database: getDatabaseConfig(),
  jwt: getJwtConfig(),
  google: getGoogleConfig(),
  email: getEmailConfig(),
  security: getSecurityConfig(),
  logging: getLoggingConfig(),
});
