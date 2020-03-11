import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkflowModel } from '@aavantan-app/models';
import { WorkflowService } from '../shared/services/workflow/workflow.service';

@Controller('workflow')
@UseGuards(AuthGuard('jwt'))
export class WorkflowController {

  constructor(private readonly _workflowService: WorkflowService) {
  }

  @Post('create')
  async createWorkflow(@Body() model: WorkflowModel) {
    return await this._workflowService.addUpdateWorkflow(model);
  }
}
