import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebHookEventModule } from './web-hook-event/web-hook-event.module';
import { typeOrmConfig } from './config/typeorm.config';
import { CallModule } from './call/call.module';
import { AircallModule } from './webhooks/aircall/aircall.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        typeOrmConfig(configService),
    }),
    WebHookEventModule,
    CallModule,
    AircallModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
