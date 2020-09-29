import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { TaskState, TaskStore } from '../../../store/task/task.store';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { BaseResponseModel, Sprint } from '@aavantan-app/models';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserStore } from '../../../store/user/user.store';
import { SprintReportUrls } from './sprint-report.url';
import { SprintReportModel } from '../../../../../../../libs/models/src/lib/models/sprint-report.model';

@Injectable()
export class SprintReportService extends BaseService<TaskStore, TaskState> {
  constructor(protected notification: NzNotificationService, protected taskStore: TaskStore, private _http: HttpWrapperService,
              private _generalService: GeneralService, private _userStore: UserStore) {
    super(taskStore, notification);
    // this.notification.info("message","suucess",{nzPlacement:'bottomRight'}); 
    // this.notification.config({
    //   nzPlacement: 'bottomRight'
    // });
  }

  getSprintReport(sprintId: string, projectId: string): Observable<BaseResponseModel<SprintReportModel>> {
    return this._http.post(SprintReportUrls.getSprintById, { projectId, sprintId }).pipe(
      map((res: BaseResponseModel<SprintReportModel>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }
}
