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
  TaskPinRequest,
  GetTaskRequestModel, GetAllTaskRequestModel, AddCommentModel
} from '@aavantan-app/models';
import { TaskUrls } from './task.url';
import { Observable } from 'rxjs';

@Injectable()
export class TaskService extends BaseService<TaskStore, TaskState> {
  constructor(protected notification: NzNotificationService, protected taskStore: TaskStore, private _http: HttpWrapperService, private _generalService: GeneralService) {
    super(taskStore, notification);
  }

  createTask(task: Task): Observable<BaseResponseModel<Task>> {
    return this._http.post(TaskUrls.base, task).pipe(
      map((res: BaseResponseModel<Task>) => {
        this.notification.success('Success', 'Task Created Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }
  getAllTask(): Observable<BaseResponseModel<Task[]>> {
    const json : GetAllTaskRequestModel= {
      projectId : this._generalService.currentProject.id,
      sort:'createdAt',
      sortBy:'desc'
    }
    return this._http.post(TaskUrls.getAllTask, json).pipe(
      map((res: BaseResponseModel<Task[]>) => {

        this.updateState({ tasks:res.data, getTaskSuccess: true, getTaskInProcess: false });

        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }
  getTask(task: GetTaskRequestModel): Observable<BaseResponseModel<Task>> {
    return this._http.get(TaskUrls.getTask.replace('displayName', task.displayName)).pipe(
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
  addComment(comment: AddCommentModel): Observable<BaseResponseModel<Task>> {
    return this._http.post(TaskUrls.addComment, comment).pipe(
      map((res: BaseResponseModel<Task>) => {
        this.notification.success('Success', 'Commented Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }
  pinComment(comment: TaskPinRequest): Observable<BaseResponseModel<Task>> {
    comment.projectId = this._generalService.currentProject.id;
    return this._http.post(TaskUrls.pinComment, comment).pipe(
      map((res: BaseResponseModel<Task>) => {
        this.notification.success('Success', 'Comment updated Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  getComments(json: TaskPinRequest): Observable<BaseResponseModel<TaskComments[]>> {
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

  getHistory(json: TaskPinRequest): Observable<BaseResponseModel<TaskHistory[]>> {
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
