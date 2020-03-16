import { Module } from '@nestjs/common';
import { SprintReportController } from './sprint-report.controller';

@Module({
  controllers: [SprintReportController]
})
export class SprintReportModule {}
