import { BaseService } from '../base.service';
import { ClientSession, Document, Model } from 'mongoose';
import {
  AddCommentModel, CommentPinModel,
  DbCollection,
  TaskComments, TaskHistory,
  TaskHistoryActionEnum,
  TaskPriorityModel, UpdateCommentModel
} from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { ModuleRef } from '@nestjs/core';
import { ProjectService } from '../project/project.service';
import { BadRequestException, OnModuleInit } from '@nestjs/common';
import { aggregateConvert_idToId, BadRequest, generateUtcDate } from '../../helpers/helpers';
import { GeneralService } from '../general.service';
import { TaskCommentUtilityService } from './task-comment.utility.service';
import { TaskService } from '../task/task.service';
import { TaskHistoryService } from '../task-history.service';

/**
 * common task population object
 */
const taskBasicPopulation: any[] = [{
  path: 'createdBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}, {
  path: 'updatedBy',
  select: 'emailId userName firstName lastName profilePic -_id',
  justOne: true
}];

export class TaskCommentService extends BaseService<TaskComments & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _taskService: TaskService;
  private _taskHistoryService: TaskHistoryService;
  private _utilityService: TaskCommentUtilityService;

  constructor(
    @InjectModel(DbCollection.taskComments) private readonly _taskCommentModel: Model<TaskComments & Document>,
    private _moduleRef: ModuleRef, private readonly _generalService: GeneralService
  ) {
    super(_taskCommentModel);
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');
    this._taskService = this._moduleRef.get('TaskService');
    this._taskHistoryService = this._moduleRef.get('TaskHistoryService');

    this._utilityService = new TaskCommentUtilityService();
  }

  /**
   * add comment
   * @param requestModel
   */
  async addComment(requestModel: AddCommentModel) {
    // check if comment is available or not
    if (!requestModel || !requestModel.comment) {
      throw new BadRequestException('please add comment');
    }

    // get project details
    const projectDetails = await this._projectService.getProjectDetails(requestModel.projectId);
    // get task details
    const taskDetails = await this._taskService.getTaskDetails(requestModel.taskId, requestModel.projectId, true);

    // add comment process
    const comment = await this.withRetrySession(async (session: ClientSession) => {
      const commentModel = new TaskComments();
      commentModel.comment = requestModel.comment.comment;
      commentModel.createdById = this._generalService.userId;
      commentModel.createdAt = generateUtcDate();
      commentModel.updatedAt = generateUtcDate();
      commentModel.taskId = requestModel.taskId;
      commentModel.isPinned = false;

      // create new comment
      const newComment = await this.create([commentModel], session);

      // get mentioned users from comment
      const newWatchers = this._utilityService.getMentionedUsersFromComment(requestModel, taskDetails, projectDetails);

      // add new watchers to watchers array
      if (newWatchers.length) {
        const taskUpdateObj: any = {
          $push: {
            'watchers': { $each: newWatchers },
            comments: newComment[0].id
          }
        };
        // update task and add new watcher's to task
        await this._taskService.updateById(requestModel.taskId, taskUpdateObj, session);
      }

      // creat task history object
      const history = this._taskHistoryService.createHistoryObject(TaskHistoryActionEnum.commentAdded, requestModel.taskId, taskDetails);
      // save task history
      await this._taskHistoryService.addHistory(history, session);
      return newComment[0];
    });

    // get comment details
    try {
      const commentDetails = await this.getDetails(comment.id, requestModel.taskId, true);

      if (!commentDetails) {
        BadRequest('Comment not found');
      }

      // re add uuid to new comment for ui use
      commentDetails.uuid = requestModel.comment.uuid;

      // send email for comment added
      this._utilityService.sendMailForCommentAdded(taskDetails, projectDetails, commentDetails);
      return commentDetails;
    } catch (e) {
      throw e;
    }
  }

  /**
   * update comment
   * @param requestModel
   */
  async updateComment(requestModel: UpdateCommentModel) {
    if (!requestModel || !requestModel.comment) {
      throw new BadRequestException('please add comment');
    }

    if (!requestModel.comment.id) {
      throw new BadRequestException('invalid request');
    }

    // update comment process
    await this.withRetrySession(async (session: ClientSession) => {
      // get project details
      await this._projectService.getProjectDetails(requestModel.projectId);
      // get task details
      const taskDetails = await this._taskService.getTaskDetails(requestModel.taskId, requestModel.projectId);
      // get comment details
      const commentDetails = await this.getDetails(requestModel.comment.id, requestModel.taskId);

      const commentUpdateObject = {
        $set: {
          comment: requestModel.comment.comment, updatedById: this._generalService.userId, updatedAt: generateUtcDate()
        }
      };

      await this.updateById(requestModel.comment.id, commentUpdateObject, session);
    });

    try {
      const commentDetails = await this.getDetails(requestModel.comment.id, requestModel.taskId, true);
      return commentDetails;
    } catch (e) {
      throw e;
    }

  }

  /**
   * pin/ unpin task comment
   * @param model
   */
  async pinComment(model: CommentPinModel): Promise<string> {
    if (!model || !model.commentId) {
      throw new BadRequestException('invalid request');
    }

    return await this.withRetrySession(async (session: ClientSession) => {
      await this._projectService.getProjectDetails(model.projectId);

      // get task details
      const taskDetails = await this._taskService.getTaskDetails(model.taskId, model.projectId);
      const commentDetails = await this.getDetails(model.commentId, model.taskId);

      // update comment by id
      await this.updateById(commentDetails.id, {
        $set: {
          isPinned: model.isPinned, pinnedById: model.isPinned ? this._generalService.userId : null,
          pinnedAt: model.isPinned ? generateUtcDate() : null
        }
      }, session);

      // create task history object
      const taskHistory = this._taskHistoryService.createHistoryObject(TaskHistoryActionEnum.commentPinned, model.taskId, taskDetails);
      await this._taskHistoryService.addHistory(taskHistory, session);

      // return message
      return `Comment ${model.isPinned ? 'Pinned' : 'Un Pinned'} Successfully`;
    });
  }

  /**
   * get all task comments
   */
  public async getAllTaskComments(projectId: string, taskId: string) {
    await this._projectService.getProjectDetails(projectId);

    const comments = await this.find({
      filter: { taskId },
      populate: taskBasicPopulation,
      lean: true
    });

    if (comments && comments.length) {
      return comments.map(comment => {
        comment.id = comment._id.toString();
        return comment;
      });
    } else {
      return [];
    }
  }

  /**
   * get task priority details by id
   * @param taskId
   * @param commentId
   * @param getFullDetails
   */
  async getDetails(commentId: string, taskId: string, getFullDetails: boolean = false) {
    try {
      if (!this.isValidObjectId(commentId)) {
        BadRequest('Task Comment not found..');
      }

      const populate = getFullDetails ? taskBasicPopulation : [];
      const taskCommentDetail = await this.findOne({
        filter: { _id: commentId, taskId },
        lean: true, populate
      });

      if (!taskCommentDetail) {
        BadRequest('Task Comment not found...');
      } else {
        taskCommentDetail.id = taskCommentDetail._id;
      }

      return taskCommentDetail;
    } catch (e) {
      throw e;
    }
  }
}
