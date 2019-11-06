import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskStore, TaskState } from '../../../store/task/task.store';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { catchError, map } from 'rxjs/operators';
import { BaseResponseModel, TimeLog, Task, TaskComments } from '@aavantan-app/models';
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
    return this._http.get(TaskUrls.base).pipe(
      map((res: BaseResponseModel<Task[]>) => {

        this.updateState({ tasks:res.data, getTaskSuccess: true, getTaskInProcess: false });

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
  addComment(taskId:string, comment: TaskComments): Observable<BaseResponseModel<Task>> {
    return this._http.post(TaskUrls.addComment.replace(':taskId', taskId), comment).pipe(
      map((res: BaseResponseModel<Task>) => {
        this.notification.success('Success', 'Commented Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }
  pinComment(comment: TaskComments): Observable<BaseResponseModel<Task>> {
    return this._http.post(TaskUrls.pinComment.replace(':commentId', comment.id), comment).pipe(
      map((res: BaseResponseModel<Task>) => {
        this.notification.success('Success', 'Comment Pinned Successfully');
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
  //
  // private updateTaskState(result: Task) {
  //   this.taskStore.update((state => {
  //     return {
  //       ...state,
  //       tasks: result,
  //
  //     };
  //   }));
  //
  //
  // }

}
