import { Module } from '@nestjs/common';
import { SprintController } from './sprint.controller';

@Module({
  controllers: [SprintController]
})
export class SprintModule {}
