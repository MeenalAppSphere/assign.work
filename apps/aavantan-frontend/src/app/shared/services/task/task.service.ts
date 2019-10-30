import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskStore } from '../../../store/task/task.store';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { catchError, map } from 'rxjs/operators';
import { BaseResponseModel } from '@aavantan-app/models';
import { TaskUrls } from './task.url';
import { Observable } from 'rxjs';

@Injectable()
export class TaskService extends BaseService<TaskStore, TaskState> {
  constructor(protected notification: NzNotificationService, protected taskStore: TaskStore, private _http: HttpWrapperService, private _generalService: GeneralService) {
    super(taskStore, notification);
  }

  addTask(task: Task): Observable<BaseResponseModel<Task>> {
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
}
