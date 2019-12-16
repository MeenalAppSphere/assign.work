import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SprintService } from '../shared/services/sprint.service';
import {
  AddTaskToSprintModel,
  CreateSprintModel,
  GetAllSprintRequestModel,
  GetSprintByIdRequestModel,
  MoveTaskToStage,
  UpdateSprintMemberWorkingCapacity
} from '@aavantan-app/models';

@Controller('sprint')
@UseGuards(AuthGuard('jwt'))
export class SprintController {

  constructor(private readonly _sprintService: SprintService) {
  }

  @Post('create')
  async createSprint(@Body() model: CreateSprintModel) {
    return await this._sprintService.createSprint(model);
  }

  @Post('add-tasks')
  async addTasks(@Body() model: AddTaskToSprintModel) {
    return await this._sprintService.addTaskToSprint(model);
  }

  @Post('move-task')
  async moveTask(@Body() model: MoveTaskToStage) {
    return await this._sprintService.moveTaskToStage(model);
  }

  @Post('all')
  async getAllSprints(@Body() model: GetAllSprintRequestModel) {
    return await this._sprintService.getAllSprints(model);
  }

  @Post('get-sprint')
  async getActiveSprint(@Body() model: GetSprintByIdRequestModel) {
    return await this._sprintService.getSprintById(model);
  }

  @Post('update-working-capacity')
  async updateMemberWorkingCapacity(@Body() model: UpdateSprintMemberWorkingCapacity) {
    return await this._sprintService.updateSprintMemberWorkingCapacity(model);
  }
}
