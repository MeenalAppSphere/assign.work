import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { TaskState, TaskStore } from '../../../store/task/task.store';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import {
  AddTaskToSprintModel,
  BasePaginatedResponse,
  BaseResponseModel,
  CreateSprintModel,
  GetAllSprintRequestModel, GetUnpublishedRequestModel, RemoveTaskFromSprintModel,
  Sprint, SprintErrorResponse, UpdateSprintMemberWorkingCapacity
} from '@aavantan-app/models';
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

  createSprint(sprintData: CreateSprintModel): Observable<BaseResponseModel<Sprint>> {
    return this._http.post(SprintUrls.addSprint, sprintData).pipe(
      map((res: BaseResponseModel<Sprint>) => {
        this.notification.success('Success', 'Sprint Created Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }
  getSprint(sprintData: Sprint): Observable<BaseResponseModel<Sprint>> {
    return this._http.post(SprintUrls.getSprint, sprintData).pipe(
      map((res: BaseResponseModel<Sprint>) => {
        // this.notification.success('Success', 'Found Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  getAllSprint(sprintData: GetAllSprintRequestModel): Observable<BaseResponseModel<BasePaginatedResponse<Sprint>>> {
    return this._http.post(SprintUrls.getAllSprint, sprintData).pipe(
      map((res: BaseResponseModel<BasePaginatedResponse<Sprint>>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }
  getUnpublishedSprint(sprintData: GetUnpublishedRequestModel): Observable<BaseResponseModel<Sprint>> {
    return this._http.post(SprintUrls.getUnpublishedSprint, sprintData).pipe(
      map((res: BaseResponseModel<Sprint>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  addTaskToSprint(sprintData: AddTaskToSprintModel): Observable<BaseResponseModel<Sprint | SprintErrorResponse>> {
    return this._http.post(SprintUrls.addTaskToSprint, sprintData).pipe(
      map((res: BaseResponseModel<SprintErrorResponse>) => {

        if((res.data.tasksErrors && res.data.tasksErrors.length>0) || (res.data.membersErrors && res.data.membersErrors.length>0)){
          this.notification.error('Error', 'Task not added to Sprint, Please check task list for reason');
        }else{
          this.notification.success('Success', 'Task successfully added to this Sprint');
        }

        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }


  removeTaskToSprint(sprintData: RemoveTaskFromSprintModel): Observable<BaseResponseModel<Sprint | SprintErrorResponse>> {
    return this._http.post(SprintUrls.removeTaskToSprint, sprintData).pipe(
      map((res: BaseResponseModel<SprintErrorResponse>) => {

        if((res.data.tasksErrors && res.data.tasksErrors.length>0) || (res.data.membersErrors && res.data.membersErrors.length>0)){
          this.notification.error('Error', 'Task not removed from Sprint');
        }else{
          this.notification.success('Success', 'Task successfully removed to this Sprint');
        }

        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  updateSprintWorkingCapacity(sprintData: UpdateSprintMemberWorkingCapacity): Observable<BaseResponseModel<Sprint>> {
    return this._http.post(SprintUrls.updateWorkingCapacity, sprintData).pipe(
      map((res: BaseResponseModel<Sprint>) => {
        this.notification.success('Success', 'Sprint working capacity updated Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }
}
