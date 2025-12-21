import { Module } from '@nestjs/common';
import { YardsService } from './yards.service';
import { YardsController } from './yards.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Yard } from './entities/yard.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Yard])],
  controllers: [YardsController],
  providers: [YardsService],
})
export class YardsModule {}
