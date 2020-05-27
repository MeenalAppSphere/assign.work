import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from '../shared/services/task/task.service';
import {
  DeleteTaskModel,
  GetAllTaskRequestModel,
  GetTaskByIdOrDisplayNameModel, SprintTaskFilterModel,
  Task,
  TaskFilterModel,
} from '@aavantan-app/models';
import { Roles } from '../shared/guard/roles.decorators';

@Controller('task')
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(private readonly _taskService: TaskService) {

  }

  @Post('get-all')
  async getAll(@Body() model: GetAllTaskRequestModel) {
    return await this._taskService.getAllTasks(model);
  }

  @Post('get-all-my-tasks')
  async getMyTasks(@Body() filterModel: TaskFilterModel) {
    return await this._taskService.getMyTask(filterModel);
  }

  @Post('get-all-backlogs')
  async getAllBacklogTasks(@Body() filterModel: TaskFilterModel) {
    return await this._taskService.getAllBacklogs(filterModel);
  }

  @Post('get-all-sprint-tasks')
  async getAllSprintTasks(@Body() filterModel: SprintTaskFilterModel) {
    return await this._taskService.getAllSprintTasks(filterModel);
  }

  @Post('get-all-unpublished-sprint-tasks')
  async getAllUnpublishedSprintTasks(@Body() filterModel: TaskFilterModel) {
    return await this._taskService.getAllUnPublishedSprintTasks(filterModel);
  }

  @Post('add')
  @Roles('task', 'canAdd_task')
  async createTask(@Body() task: Task) {
    return await this._taskService.addTask(task);
  }

  @Post('update')
  async updateTask(@Body() model: Task) {
    return await this._taskService.updateTask(model);
  }

  @Post('delete-task')
  @Roles('task', 'canRemove_task')
  async deleteTask(@Body() model: DeleteTaskModel) {
    return await this._taskService.deleteTask(model);
  }

  @Post('get-task')
  async getByIdOrDisplayName(@Body() model: GetTaskByIdOrDisplayNameModel) {
    return this._taskService.getTaskByIdOrDisplayName(model);
  }

  @Post('filter')
  async getTask(@Body() filterModel: TaskFilterModel) {
    return await this._taskService.getTasks(filterModel);
  }
}
