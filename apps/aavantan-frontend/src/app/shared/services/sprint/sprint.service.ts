import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { TaskState, TaskStore } from '../../../store/task/task.store';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { BaseResponseModel, Sprint } from '@aavantan-app/models';
import { Observable } from 'rxjs';
import { SprintUrls } from './sprint.url';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class SprintService extends BaseService<TaskStore, TaskState> {
  constructor(protected notification: NzNotificationService, protected taskStore: TaskStore, private _http: HttpWrapperService, private _generalService: GeneralService) {
    super(taskStore, notification);
    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  createSprint(sprint: Sprint): Observable<BaseResponseModel<Sprint>> {
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

}
