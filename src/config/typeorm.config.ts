import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get('DATABASE_URL'),
  /*host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  username: configService.get('DATABASE_USER'),
  password: configService.get('DATABASE_PASS'),
  database: configService.get('DATABASE_NAME'), */
  logging: false,
  ssl:
    configService.get('DATABASE_URL')?.includes('localhost') ||
    configService.get('DATABASE_URL')?.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  autoLoadEntities: true,
  synchronize: false,
  extra: {
    timezone: 'America/Santo_Domingo',
  },
});
