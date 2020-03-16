import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SprintService } from '../shared/services/sprint/sprint.service';
import {
  AddTaskToSprintModel,
  CloseSprintModel,
  CreateSprintModel,
  GetAllSprintRequestModel,
  GetSprintByIdRequestModel,
  MoveTaskToColumnModel,
  PublishSprintModel,
  RemoveTaskFromSprintModel, SprintFilterTasksModel,
  UpdateSprintMemberWorkingCapacity,
  UpdateSprintModel
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

  @Post('update')
  async updateSprint(@Body() model: UpdateSprintModel) {
    return await this._sprintService.updateSprint(model);
  }

  @Post('add-task')
  async addTask(@Body() model: AddTaskToSprintModel) {
    return await this._sprintService.addTaskToSprint(model);
  }

  @Post('remove-task')
  async removeTasks(@Body() model: RemoveTaskFromSprintModel) {
    return await this._sprintService.removeTaskFromSprint(model);
  }

  @Post('move-task')
  async moveTask(@Body() model: MoveTaskToColumnModel) {
    return await this._sprintService.moveTaskToColumn(model);
  }

  @Post('all')
  async getAllSprints(@Body() model: GetAllSprintRequestModel) {
    return await this._sprintService.getAllSprints(model);
  }

  @Post('get-sprint')
  async getSprint(@Body() model: GetSprintByIdRequestModel) {
    return await this._sprintService.getSprintById(model);
  }

  @Post('filter-sprint-tasks')
  async filterSprintTasks(@Body() model: SprintFilterTasksModel) {
    return await this._sprintService.filterSprintTasks(model);
  }

  @Post('get-published-sprint')
  async getPublishedSprint(@Body() model: GetSprintByIdRequestModel) {
    return await this._sprintService.getPublishedSprintById(model);
  }

  @Post('update-working-capacity')
  async updateMemberWorkingCapacity(@Body() model: UpdateSprintMemberWorkingCapacity) {
    return await this._sprintService.updateSprintMemberWorkingCapacity(model);
  }

  @Post('publish-sprint')
  async publishSprint(@Body() model: PublishSprintModel) {
    return await this._sprintService.publishSprint(model);
  }

  @Post('get-unpublished-sprint')
  async getUnPublishedSprint(@Body('projectId') projectId: string) {
    return await this._sprintService.getUnPublishSprint(projectId);
  }

  @Post('close-sprint')
  async closeSprint(@Body() model: CloseSprintModel) {
    return await this._sprintService.closeSprint(model);
  }

  @Post('get-closed-sprints')
  async getClosedSprints(@Body('projectId') projectId: string) {
    return await this._sprintService.getClosedSprintsList(projectId);
  }
}
