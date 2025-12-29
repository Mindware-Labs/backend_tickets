import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const jwtConstants = {
  secret:
    configService.get<string>('JWT_SECRET') ||
    process.env.JWT_SECRET ||
    'default_jwt_secret',
};
