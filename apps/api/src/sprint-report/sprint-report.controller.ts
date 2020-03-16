import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SprintReportService } from '../shared/services/sprint-report/sprint-report.service';


@Controller('sprint-report')
@UseGuards(AuthGuard('jwt'))
export class SprintReportController {

  constructor(private readonly _sprintReportService: SprintReportService) {
  }

  @Post('get-by-id')
  async createSprint(@Body('reportId') reportId: string, @Body('sprintId') sprintId: string) {
    return await this._sprintReportService.getReportById(reportId, sprintId);
  }
}
