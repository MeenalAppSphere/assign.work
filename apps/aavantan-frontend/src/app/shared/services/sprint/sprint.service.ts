import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { TaskState, TaskStore } from '../../../store/task/task.store';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import {
  BasePaginatedResponse,
  BaseResponseModel,
  CreateSprintModel,
  GetAllSprintRequestModel,
  GetAllTaskRequestModel,
  Sprint, Task
} from '@aavantan-app/models';
import { Observable } from 'rxjs';
import { SprintUrls } from './sprint.url';
import { catchError, map } from 'rxjs/operators';
import { TaskUrls } from '../task/task.url';

@Injectable()
export class SprintService extends BaseService<TaskStore, TaskState> {
  constructor(protected notification: NzNotificationService, protected taskStore: TaskStore, private _http: HttpWrapperService, private _generalService: GeneralService) {
    super(taskStore, notification);
    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  createSprint(sprint: CreateSprintModel): Observable<BaseResponseModel<Sprint>> {
    return this._http.post(SprintUrls.addSprint, sprint).pipe(
      map((res: BaseResponseModel<Sprint>) => {
        this.notification.success('Success', 'Sprint Created Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }
  getSprint(sprint: Sprint): Observable<BaseResponseModel<Sprint>> {
    return this._http.post(SprintUrls.getSprint, sprint).pipe(
      map((res: BaseResponseModel<Sprint>) => {
        // this.notification.success('Success', 'Found Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  getAllSprint(sprint: GetAllSprintRequestModel): Observable<BaseResponseModel<BasePaginatedResponse<Sprint>>> {
    return this._http.post(SprintUrls.getAllSprint, sprint).pipe(
      map((res: BaseResponseModel<BasePaginatedResponse<Sprint>>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  addTaskToSprint(sprint: Sprint): Observable<BaseResponseModel<Sprint[]>> {
    return this._http.post(SprintUrls.addTaskToSprint, sprint).pipe(
      map((res: BaseResponseModel<Sprint[]>) => {
        this.notification.success('Success', 'Found Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

}
