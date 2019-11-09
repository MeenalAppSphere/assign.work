import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskStore, TaskState } from '../../../store/task/task.store';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { catchError, map } from 'rxjs/operators';
import {
  BaseResponseModel,
  TimeLog,
  Task,
  TaskComments,
  TaskHistory,
  CommentPinModel,
  GetTaskByIdOrDisplayNameModel, GetAllTaskRequestModel, AddCommentModel, BasePaginatedResponse
} from '@aavantan-app/models';
import { TaskUrls } from './task.url';
import { Observable } from 'rxjs';

@Injectable()
export class TaskService extends BaseService<TaskStore, TaskState> {
  constructor(protected notification: NzNotificationService, protected taskStore: TaskStore, private _http: HttpWrapperService, private _generalService: GeneralService) {
    super(taskStore, notification);
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
  getAllTask(): Observable<BaseResponseModel<BasePaginatedResponse<Task>>> {
    const json : GetAllTaskRequestModel= {
      projectId : this._generalService.currentProject.id,
      sort:'createdAt',
      sortBy:'desc'
    }
    return this._http.post(TaskUrls.getAllTask, json).pipe(
      map((res: BaseResponseModel<BasePaginatedResponse<Task>>) => {

        this.updateState({ tasks:res.data.items, getTaskSuccess: true, getTaskInProcess: false });

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
  updateTask(task: Task): Observable<BaseResponseModel<Task>> {
    return this._http.put(TaskUrls.base, task).pipe(
      map((res: BaseResponseModel<Task>) => {
        this.notification.success('Success', 'Task Updated Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }
  addComment(comment: AddCommentModel): Observable<BaseResponseModel<string>> {
    return this._http.post(TaskUrls.addComment, comment).pipe(
      map((res: BaseResponseModel<string>) => {
        this.notification.success('Success', res.data);
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

  getHistory(json: CommentPinModel): Observable<BaseResponseModel<TaskHistory[]>> {
    json.projectId = this._generalService.currentProject.id;
    return this._http.post(TaskUrls.getHistory, json).pipe(
      map((res: BaseResponseModel<TaskHistory[]>) => {
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
  addTimelog(timeLog: TimeLog, id: string): Observable<BaseResponseModel<TimeLog>> {
    return this._http.post(TaskUrls.base
      .replace(':taskId', id), timeLog).pipe(
      map((res: BaseResponseModel<TimeLog>) => {
        this.notification.success('Success', 'Time Logged Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

}
