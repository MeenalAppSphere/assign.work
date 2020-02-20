import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { TaskState, TaskStore } from '../../../store/task/task.store';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import {
  AddTaskRemoveTaskToSprintResponseModel,
  AddTaskToSprintModel,
  AssignTasksToSprintModel,
  BasePaginatedResponse,
  BaseResponseModel,
  CloseSprintModel,
  CreateSprintModel,
  GetAllSprintRequestModel,
  GetAllTaskRequestModel,
  GetUnpublishedRequestModel,
  MoveTaskToColumnModel,
  RemoveTaskFromSprintModel,
  Sprint,
  SprintBaseRequest,
  SprintErrorResponse,
  UpdateSprintMemberWorkingCapacity,
  UpdateSprintModel
} from '@aavantan-app/models';
import { Observable } from 'rxjs';
import { SprintUrls } from './sprint.url';
import { catchError, map } from 'rxjs/operators';
import { UserState, UserStore } from '../../../store/user/user.store';

@Injectable()
export class SprintService extends BaseService<TaskStore, TaskState> {
  constructor(protected notification: NzNotificationService, protected taskStore: TaskStore, private _http: HttpWrapperService,
              private _generalService: GeneralService, private _userStore: UserStore) {
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

  updateSprint(sprintData: UpdateSprintModel): Observable<BaseResponseModel<Sprint>> {
    return this._http.post(SprintUrls.updateSprint, sprintData).pipe(
      map((res: BaseResponseModel<Sprint>) => {
        this.notification.success('Success', 'Sprint Updated Successfully');
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


  getBoardData(json: GetAllTaskRequestModel): Observable<BaseResponseModel<Sprint>> {
    return this._http.post(SprintUrls.getBoardData, json).pipe(
      map((res: BaseResponseModel<Sprint>) => {
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

  publishSprint(sprintData: SprintBaseRequest): Observable<BaseResponseModel<Sprint>> {
    return this._http.post(SprintUrls.publishSprint, sprintData).pipe(
      map((res: BaseResponseModel<Sprint>) => {
        this.notification.success('Success', 'Sprint published successfully');

        // update current project and set sprint id
        this._userStore.update((state: UserState) => {
          return {
            ...state,
            currentProject: {
              ...state.currentProject,
              sprintId: sprintData.sprintId
            }
          };
        });
        // set published sprint id to general service
        this._generalService.currentProject.sprintId = sprintData.sprintId;
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

  assignTaskToSprint(sprintData: AssignTasksToSprintModel): Observable<BaseResponseModel<AddTaskRemoveTaskToSprintResponseModel | SprintErrorResponse>> {
    return this._http.post(SprintUrls.assignTaskToSprint, sprintData).pipe(
      map((res: BaseResponseModel<AddTaskRemoveTaskToSprintResponseModel | SprintErrorResponse>) => {


        if ((!(res.data instanceof AddTaskRemoveTaskToSprintResponseModel) && res.data.tasksErrors && res.data.tasksErrors.length > 0)
          || (!(res.data instanceof AddTaskRemoveTaskToSprintResponseModel) && res.data.membersErrors && res.data.membersErrors.length > 0)) {
          this.notification.error('Error', 'Task not added to Sprint, Please check task list for reason');
        } else {
          this.notification.success('Success', 'Task successfully added to this Sprint');
        }

        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  moveTaskToStage(json: MoveTaskToColumnModel): Observable<BaseResponseModel<Sprint>> {
    return this._http.post(SprintUrls.moveTaskToStage, json).pipe(
      map((res: BaseResponseModel<Sprint>) => {
        this.notification.success('Success', 'Task Moved Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  closeSprint(json: CloseSprintModel): Observable<BaseResponseModel<Sprint>> {
    return this._http.post(SprintUrls.closeSprint, json).pipe(
      map((res: BaseResponseModel<Sprint>) => {
        this.notification.success('Success', 'Sprint closed Successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  removeTaskToSprint(sprintData: RemoveTaskFromSprintModel): Observable<BaseResponseModel<AddTaskRemoveTaskToSprintResponseModel>> {
    return this._http.post(SprintUrls.removeTaskToSprint, sprintData).pipe(
      map((res: BaseResponseModel<AddTaskRemoveTaskToSprintResponseModel>) => {

        if (res) {
          this.notification.success('Success', 'Task successfully removed to this Sprint');
        } else {
          this.notification.error('Error', 'Task not removed from Sprint');
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


  addTaskToSprint(sprintData: AddTaskToSprintModel): Observable<BaseResponseModel<AddTaskRemoveTaskToSprintResponseModel>> {
    return this._http.post(SprintUrls.addSingleTask, sprintData).pipe(
      map((res: BaseResponseModel<AddTaskRemoveTaskToSprintResponseModel>) => {

        if (res) {
          this.notification.success('Success', 'Task successfully added to this Sprint');
        } else {
          this.notification.error('Error', 'Task not added to Sprint');
        }

        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  removeTaskFromSprint(sprintData: RemoveTaskFromSprintModel): Observable<BaseResponseModel<AddTaskRemoveTaskToSprintResponseModel>> {
    return this._http.post(SprintUrls.removeSingleTask, sprintData).pipe(
      map((res: BaseResponseModel<AddTaskRemoveTaskToSprintResponseModel>) => {

        if (res) {
          this.notification.success('Success', 'Task successfully removed from this Sprint');
        } else {
          this.notification.error('Error', 'Task not removed from Sprint');
        }

        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }


}
