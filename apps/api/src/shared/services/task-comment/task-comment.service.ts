import { BaseService } from '../base.service';
import { ClientSession, Document, Model } from 'mongoose';
import {
  AddCommentModel,
  CommentPinModel,
  DbCollection,
  DeleteCommentModel,
  EmailSubjectEnum,
  TaskComments,
  TaskHistoryActionEnum,
  UpdateCommentModel
} from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { ModuleRef } from '@nestjs/core';
import { ProjectService } from '../project/project.service';
import { BadRequestException, OnModuleInit } from '@nestjs/common';
import { BadRequest, generateUtcDate } from '../../helpers/helpers';
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
}, {
  path: 'pinnedBy',
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

      // task object for create task
      const taskUpdateObj: any = {
        $push: {
          'comments': newComment[0].id
        }
      };

      // get mentioned users from comment
      const newWatchers = this._utilityService.getMentionedUsersFromComment(requestModel.comment.comment, taskDetails, projectDetails);

      // add new watchers to watchers array
      if (newWatchers.length) {
        taskUpdateObj.$push['watchers'] = { $each: newWatchers };
      }

      // update task and add new watcher's to task
      await this._taskService.updateById(requestModel.taskId, taskUpdateObj, session);

      // creat comment history object
      const history = this._taskHistoryService.createHistoryObject(TaskHistoryActionEnum.commentAdded, requestModel.taskId, taskDetails);
      // save comment history
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
      this._utilityService.sendMailForComments(taskDetails, projectDetails, commentDetails, EmailSubjectEnum.taskCommentAdded, 'comment-added');
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

    // get project details
    const projectDetails = await this._projectService.getProjectDetails(requestModel.projectId);
    // get task details
    const taskDetails = await this._taskService.getTaskDetails(requestModel.taskId, requestModel.projectId, true);

    // update comment process
    await this.withRetrySession(async (session: ClientSession) => {
      // get comment details
      await this.getDetails(requestModel.comment.id, requestModel.taskId);

      const commentUpdateObject: any = {
        $set: {
          comment: requestModel.comment.comment, updatedById: this._generalService.userId, updatedAt: generateUtcDate()
        }
      };

      // update comment by id
      await this.updateById(requestModel.comment.id, commentUpdateObject, session);

      // get mentioned users from comment
      const newWatchers = this._utilityService.getMentionedUsersFromComment(requestModel.comment.comment, taskDetails, projectDetails);

      // add new watchers to watchers array
      if (newWatchers.length) {
        // update task and add new watcher's to task
        await this._taskService.updateById(requestModel.taskId, {
          $push: { watchers: { $each: newWatchers } }
        }, session);
      }

      // creat comment history object
      const history = this._taskHistoryService.createHistoryObject(TaskHistoryActionEnum.commentUpdated, requestModel.taskId, taskDetails);
      // save update comment history
      await this._taskHistoryService.addHistory(history, session);
    });

    // get updated comment and return it
    try {
      const commentDetails = await this.getDetails(requestModel.comment.id, requestModel.taskId, true);

      // send email
      this._utilityService.sendMailForComments(taskDetails, projectDetails, commentDetails, EmailSubjectEnum.taskCommentUpdated, 'comment-updated');

      return commentDetails;
    } catch (e) {
      throw e;
    }
  }

  /**
   * delete comment
   * @param requestModel
   */
  async deleteComment(requestModel: DeleteCommentModel) {
    if (!requestModel) {
      BadRequest('project not found');
    }

    // delete comment process
    return await this.withRetrySession(async (session) => {
      // get project details
      await this._projectService.getProjectDetails(requestModel.projectId);
      // get task details
      const taskDetails = await this._taskService.getTaskDetails(requestModel.taskId, requestModel.projectId);
      // get comment details
      await this.getDetails(requestModel.commentId, requestModel.taskId);

      const commentDeleteObject = {
        $set: {
          isDeleted: true, deletedById: this._generalService.userId, deletedAt: generateUtcDate()
        }
      };

      // update comment and set isDeleted true
      await this.updateById(requestModel.commentId, commentDeleteObject, session);

      // create history object for comment deleted
      const history = this._taskHistoryService.createHistoryObject(TaskHistoryActionEnum.commentDeleted, requestModel.taskId, taskDetails);
      // save delete comment history
      await this._taskHistoryService.addHistory(history, session);

      return 'Comment Deleted Successfully';
    });
  }

  /**
   * pin/ unpin task comment
   * @param requestModel
   */
  async pinComment(requestModel: CommentPinModel): Promise<string> {
    if (!requestModel || !requestModel.commentId) {
      throw new BadRequestException('invalid request');
    }
    const projectDetails = await this._projectService.getProjectDetails(requestModel.projectId);
    // get task details
    const taskDetails = await this._taskService.getTaskDetails(requestModel.taskId, requestModel.projectId, true);

    // pin comment process
    await this.withRetrySession(async (session: ClientSession) => {
      const commentDetails = await this.getDetails(requestModel.commentId, requestModel.taskId);

      // update comment by id
      await this.updateById(commentDetails.id, {
        $set: {
          updatedAt: generateUtcDate(), updatedById: this._generalService.userId,
          isPinned: requestModel.isPinned, pinnedById: requestModel.isPinned ? this._generalService.userId : null,
          pinnedAt: requestModel.isPinned ? generateUtcDate() : null
        }
      }, session);

      // create task history object
      const taskHistory = this._taskHistoryService.createHistoryObject(TaskHistoryActionEnum.commentPinned, requestModel.taskId, taskDetails);
      await this._taskHistoryService.addHistory(taskHistory, session);
    });

    // get task details and send email
    try {
      const commentDetails = await this.getDetails(requestModel.commentId, requestModel.taskId, true);
      // send email
      this._utilityService.sendMailForComments(taskDetails, projectDetails, commentDetails,
        requestModel.isPinned ? EmailSubjectEnum.taskCommentPinned : EmailSubjectEnum.taskCommentUnPinned,
        requestModel.isPinned ? 'pinned-comment' : 'un-pinned-comment');

      // return message
      return `Comment ${requestModel.isPinned ? 'Pinned' : 'Un Pinned'} Successfully`;
    } catch (e) {
      throw e;
    }
  }

  /**
   * get all task comments
   */
  async getAllTaskComments(projectId: string, taskId: string) {
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
