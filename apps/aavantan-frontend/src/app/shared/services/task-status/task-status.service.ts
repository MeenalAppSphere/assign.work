import { BaseService } from '../base.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { catchError, map } from 'rxjs/operators';
import { BaseResponseModel, TaskStatusModel } from '@aavantan-app/models';
import { Observable } from 'rxjs';
import { TaskStatusState, TaskStatusStore } from '../../../store/task-status/task-status.store';
import { TaskStatusUrls } from './task-status.url';
import { cloneDeep } from 'lodash';
import { Injectable } from '@angular/core';

@Injectable()
export class TaskStatusService extends BaseService<TaskStatusStore, TaskStatusState> {
  constructor(protected notification: NzNotificationService, protected taskStatusStore: TaskStatusStore, private _http: HttpWrapperService,
              private _generalService: GeneralService) {
    super(taskStatusStore, notification);
    // this.notification.info("message","success",{nzPlacement:'bottomRight'});            
    // this.notification.config({
    //   nzPlacement: 'bottomRight'
    // });
  }

  getAllTaskStatuses(projectId: string) {
    this.updateState({ statuses: [], getAllInProcess: true, getAllSuccess: false });
    return this._http.post(TaskStatusUrls.getAllTaskStatuses, { projectId }).pipe(
      map((res: BaseResponseModel<TaskStatusModel[]>) => {
        this.updateState({ statuses: res.data, getAllInProcess: false, getAllSuccess: true });
        return res;
      }),
      catchError((e) => {
        this.updateState({ statuses: [], getAllInProcess: false, getAllSuccess: false });
        return this.handleError(e);
      })
    );
  }

  createTaskStatus(taskStatus: TaskStatusModel): Observable<BaseResponseModel<TaskStatusModel>> {
    this.updateState({ addNewInProcess: true, addNewSuccess: false });
    return this._http.post(TaskStatusUrls.addTaskStatus, taskStatus).pipe(
      map((res: BaseResponseModel<TaskStatusModel>) => {

        this.store.update(state => {
          return {
            ...state,
            addNewSuccess: true,
            addNewInProcess: false,
            statuses: [...state.statuses, res.data]
          };
        });
        this.notification.success('Success', 'Task Status Created Successfully');
        return res;
      }),
      catchError(err => {
        this.updateState({ addNewInProcess: false, addNewSuccess: false });
        return this.handleError(err);
      })
    );
  }

  updateTaskStatus(taskStatus: TaskStatusModel): Observable<BaseResponseModel<TaskStatusModel>> {
    this.updateState({ updateInProcess: true, updateSuccess: false });
    return this._http.post(TaskStatusUrls.updateTaskStatus, taskStatus).pipe(
      map((res: BaseResponseModel<TaskStatusModel>) => {
        this.updateState({ updateInProcess: false, updateSuccess: true });

        this.store.update(state => {

          const preState = cloneDeep(state);
          const index = preState.statuses.findIndex((ele) => ele.id === res.data.id);
          preState.statuses[index] = res.data;
          return {
            ...state,
            addNewSuccess: true,
            addNewInProcess: false,
            statuses: preState.statuses
          };
        });

        this.notification.success('Success', 'Task Status Updated Successfully');
        return res;
      }),
      catchError(err => {
        this.updateState({ updateInProcess: false, updateSuccess: false });
        return this.handleError(err);
      })
    );
  }

}
