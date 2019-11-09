import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from '../shared/services/task.service';
import {
  AddCommentModel,
  CommentPinModel,
  CreateTaskModel,
  DeleteCommentModel,
  DeleteTaskModel,
  GetAllTaskRequestModel,
  GetCommentsModel,
  GetMyTaskRequestModel,
  GetTaskByIdOrDisplayNameModel,
  TaskFilterDto,
  UpdateCommentModel,
  UpdateTaskModel
} from '@aavantan-app/models';

const taskBasicPopulation: any[] = [{
  path: 'createdBy',
  select: 'emailId userName firstName lastName -_id',
  justOne: true
}, {
  path: 'assignee',
  select: 'emailId userName firstName lastName -_id',
  justOne: true
}];

@Controller('task')
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(private readonly _taskService: TaskService) {

  }

  @Post('get-all')
  async getAll(@Body() model: GetAllTaskRequestModel) {
    model.populate = taskBasicPopulation;
    return await this._taskService.getAllTasks(model);
  }

  @Post('my-task')
  async getMyTasks(@Body() model: GetMyTaskRequestModel) {
    model.populate = taskBasicPopulation;
    return await this._taskService.getMyTask(model);
  }

  @Post('add')
  async createTask(@Body() task: CreateTaskModel) {
    return await this._taskService.addTask(task);
  }

  @Post('update')
  async updateTask(@Body() model: UpdateTaskModel) {
    return await this._taskService.updateTask(model);
  }

  @Post('get-comments')
  async getComments(@Body() model: GetCommentsModel) {
    return await this._taskService.getComments(model);
  }

  @Post('add-comment')
  async addComment(@Body() model: AddCommentModel) {
    return await this._taskService.addComment(model);
  }

  @Post('update-comment')
  async updateComment(@Body() model: UpdateCommentModel) {
    return await this._taskService.updateComment(model);
  }

  @Post('pin-comment')
  async pinComment(@Body() model: CommentPinModel) {
    return await this._taskService.pinComment(model);
  }

  @Post('delete-comment')
  async deleteComment(@Body() model: DeleteCommentModel) {
    return await this._taskService.deleteComment(model);
  }

  @Post('delete-task')
  async deleteTask(@Body() model: DeleteTaskModel) {
    return await this._taskService.delete(model.taskId);
  }

  @Post('get-task')
  async getByIdOrDisplayName(@Body() model: GetTaskByIdOrDisplayNameModel) {
    return this._taskService.getTaskByIdOrDisplayName(model, taskBasicPopulation);
  }

  @Post('filter')
  async getTask(@Body() filterModel: TaskFilterDto) {
    return await this._taskService.getTasks(filterModel, taskBasicPopulation);
  }
}
