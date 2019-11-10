import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ProjectService } from '../shared/services/project.service';
import {
  MongoosePaginateQuery,
  Project,
  ProjectMembers,
  ProjectPriority,
  ProjectStages, ProjectStatus, ProjectWorkingCapacityUpdateDto, SwitchProjectRequest,
  TaskType
} from '@aavantan-app/models';
import { AuthGuard } from '@nestjs/passport';

@Controller('project')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {

  constructor(private readonly _projectService: ProjectService) {

  }

  @Get()
  async getAll() {
    return await this._projectService.getAll({}, ['members.userDetails']);
  }

  @Post()
  async createProject(@Body() model: Project) {
    return await this._projectService.addProject(model);
  }

  @Delete(':id')
  async deleteProject(@Param() id: string) {
    return await this._projectService.delete(id);
  }

  @Put(':id')
  async updateProject(@Param('id') id: string, @Body() project: Project) {
    return await this._projectService.updateProject(id, project);
  }

  @Post(':id/add-collaborators')
  async addCollaborators(@Param('id') id: string, @Body() members: ProjectMembers[]) {
    return await this._projectService.addCollaborators(id, members);
  }

  @Post(':id/add-stage')
  async addStage(@Param('id') id: string, @Body() stage: ProjectStages) {
    return await this._projectService.createStage(id, stage);
  }

  @Delete(':id/remove-stage/:stageId')
  async removeStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return await this._projectService.removeStage(id, stageId);
  }

  @Post(':id/add-task-type')
  async addTaskType(@Param('id') id: string, @Body() taskType: TaskType) {
    return await this._projectService.createTaskType(id, taskType);
  }

  @Delete(':id/remove-task-type/:taskTypeId')
  async removeTaskType(@Param('id') id: string, @Param('taskTypeId') taskTypeId: string) {
    return await this._projectService.removeTaskType(id, taskTypeId);
  }

  @Post(':id/add-status')
  async addStatus(@Param('id') id: string, @Body() status: ProjectStatus) {
    return await this._projectService.createStatus(id, status);
  }

  @Delete(':id/remove-status/:statusId')
  async removeStatus(@Param('id') id: string, @Param('statusId') statusId: string) {
    return await this._projectService.removeStatus(id, statusId);
  }

  @Put(':id/update-working-capacity')
  async updateCollaboratorWorkingCapacity(@Param('id') id: string, @Body() dto: ProjectWorkingCapacityUpdateDto[]) {
    return await this._projectService.updateCollaboratorWorkingCapacity(id, dto);
  }

  @Post(':id/add-priority')
  async addPriority(@Param('id') id: string, @Body() priority: ProjectPriority) {
    return await this._projectService.createPriority(id, priority);
  }

  @Delete(':id/remove-priority/:priorityId')
  async removePriority(@Param('id') id: string, @Param('priorityId') priorityId: string) {
    return await this._projectService.removePriority(id, priorityId);
  }

  @Post('switch-project')
  async switchProject(model: SwitchProjectRequest) {
    return await this._projectService.switchProject(model);
  }
}
