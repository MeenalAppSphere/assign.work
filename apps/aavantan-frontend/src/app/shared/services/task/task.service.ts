import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskState, TaskStore } from '../../../store/task/task.store';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { catchError, map } from 'rxjs/operators';
import {
  AddCommentModel,
  AddTaskTimeModel,
  BasePaginatedResponse,
  BaseResponseModel,
  CommentPinModel,
  GetAllTaskRequestModel,
  GetTaskByIdOrDisplayNameModel,
  GetTaskHistoryModel,
  Task,
  TaskComments, TaskFilterDto,
  TaskHistory,
  TaskTimeLog,
  TaskTimeLogHistoryModel,
  TaskTimeLogHistoryResponseModel,
  UpdateCommentModel
} from '@aavantan-app/models';
import { TaskUrls } from './task.url';
import { Observable } from 'rxjs';

@Injectable()
export class TaskService extends BaseService<TaskStore, TaskState> {
  constructor(protected notification: NzNotificationService, protected taskStore: TaskStore, private _http: HttpWrapperService, private _generalService: GeneralService) {
    super(taskStore, notification);
    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  createTask(task: Task): Observable<BaseResponseModel<Task>> {
    return this._http.post(TaskUrls.addTask, task).pipe(
      map((res: BaseResponseModel<Task>) => {
        this.notification.success('Success', 'Task Created Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  getAllTask(json: GetAllTaskRequestModel): Observable<BaseResponseModel<BasePaginatedResponse<Task>>> {

    return this._http.post(TaskUrls.getAllTask, json).pipe(
      map((res: BaseResponseModel<BasePaginatedResponse<Task>>) => {

        this.updateState({ tasks: res.data.items, getTaskSuccess: true, getTaskInProcess: false });

        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  getAllBacklogTasks(json: GetAllTaskRequestModel): Observable<BaseResponseModel<BasePaginatedResponse<Task>>> {

    return this._http.post(TaskUrls.getAllBacklogTasks, json).pipe(
      map((res: BaseResponseModel<BasePaginatedResponse<Task>>) => {

        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  getTask(task: GetTaskByIdOrDisplayNameModel): Observable<BaseResponseModel<Task>> {
    return this._http.post(TaskUrls.getTask, task).pipe(
      map((res: BaseResponseModel<Task>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  getTaskWithFilter(filter: TaskFilterDto) {
    return this._http.post(TaskUrls.getAllTaskWithFilter, filter).pipe(
      map((res: BaseResponseModel<Task[]>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  updateTask(task: Task): Observable<BaseResponseModel<Task>> {
    return this._http.post(TaskUrls.update, task).pipe(
      map((res: BaseResponseModel<Task>) => {
        this.notification.success('Success', 'Task Updated Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  removeAttachment(id: string): Observable<BaseResponseModel<Task>> {
    return this._http.delete(TaskUrls.removeAttachement.replace(':id', id)).pipe(
      map((res: BaseResponseModel<Task>) => {
        this.notification.success('Success', 'Attachment removed Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  addComment(comment: AddCommentModel): Observable<BaseResponseModel<TaskComments>> {
    return this._http.post(TaskUrls.addComment, comment).pipe(
      map((res: BaseResponseModel<TaskComments>) => {
        this.notification.success('Success', 'Comment Added Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  updateComment(comment: UpdateCommentModel): Observable<BaseResponseModel<string>> {

    return this._http.post(TaskUrls.updateComment, comment).pipe(
      map((res: BaseResponseModel<string>) => {
        this.notification.success('Success', 'Comment Updated Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  pinComment(comment: CommentPinModel): Observable<BaseResponseModel<string>> {
    comment.projectId = this._generalService.currentProject.id;
    return this._http.post(TaskUrls.pinComment, comment).pipe(
      map((res: BaseResponseModel<string>) => {
        this.notification.success('Success', res.data);
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  getComments(json: CommentPinModel): Observable<BaseResponseModel<TaskComments[]>> {
    json.projectId = this._generalService.currentProject.id;
    return this._http.post(TaskUrls.getComments, json).pipe(
      map((res: BaseResponseModel<TaskComments[]>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  getHistory(json: GetTaskHistoryModel): Observable<BaseResponseModel<BasePaginatedResponse<TaskHistory>>> {
    json.projectId = this._generalService.currentProject.id;
    return this._http.post(TaskUrls.getHistory, json).pipe(
      map((res: BaseResponseModel<BasePaginatedResponse<TaskHistory>>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  addAttachment(task: Task): Observable<BaseResponseModel<Task>> {
    return this._http.post(TaskUrls.attachement, task).pipe(
      map((res: BaseResponseModel<Task>) => {
        this.notification.success('Success', 'File uploaded Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  addTimelog(timeLog: AddTaskTimeModel): Observable<BaseResponseModel<TaskTimeLog>> {
    return this._http.post(TaskUrls.addTimelog, timeLog).pipe(
      map((res: BaseResponseModel<TaskTimeLog>) => {
        this.notification.success('Success', 'Time Logged Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  getLogHistory(json: TaskTimeLogHistoryModel): Observable<BaseResponseModel<TaskTimeLogHistoryResponseModel[]>> {
    json.projectId = this._generalService.currentProject.id;
    return this._http.post(TaskUrls.getLogHistory, json).pipe(
      map((res: BaseResponseModel<TaskTimeLogHistoryResponseModel[]>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

}
