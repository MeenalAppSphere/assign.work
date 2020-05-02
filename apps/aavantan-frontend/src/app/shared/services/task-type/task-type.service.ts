import { BaseService } from '../base.service';
import { TaskTypeState, TaskTypeStore } from '../../../store/task-type/task-type.store';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { TaskTypeUrls } from './task-type.url';
import { catchError, map } from 'rxjs/operators';
import { BaseResponseModel, TaskTypeModel } from '@aavantan-app/models';
import { Observable } from 'rxjs';
import { cloneDeep } from 'lodash';

export class TaskTypeService extends BaseService<TaskTypeStore, TaskTypeState> {
  constructor(protected notification: NzNotificationService, protected taskTypeStore: TaskTypeStore, private _http: HttpWrapperService, private _generalService: GeneralService) {
    super(taskTypeStore, notification);

    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  getAllTaskTypes(projectId: string) {
    this.updateState({ types: [], getAllInProcess: true, getAllSuccess: false });
    return this._http.post(TaskTypeUrls.getAllTaskTypes, { projectId }).pipe(
      map((res: BaseResponseModel<TaskTypeModel[]>) => {
        this.updateState({ types: res.data, getAllInProcess: false, getAllSuccess: true });
      }),
      catchError((e) => {
        this.updateState({ types: [], getAllInProcess: false, getAllSuccess: false });
        return this.handleError(e);
      })
    );
  }

  createTaskType(taskType: TaskTypeModel): Observable<BaseResponseModel<TaskTypeModel>> {
    this.updateState({ addNewInProcess: true, addNewSuccess: false });
    return this._http.post(TaskTypeUrls.addTaskType, taskType).pipe(
      map((res: BaseResponseModel<TaskTypeModel>) => {

        this.store.update(state => {
          return {
            ...state,
            addNewSuccess: true,
            addNewInProcess: false,
            types: [...state.types, res.data]
          };
        });

        this.notification.success('Success', 'Task Type Created Successfully');
        return res;
      }),
      catchError(err => {
        this.updateState({ addNewInProcess: false, addNewSuccess: false });
        return this.handleError(err);
      })
    );
  }

  updateTaskType(taskType: TaskTypeModel): Observable<BaseResponseModel<TaskTypeModel>> {
    this.updateState({ updateInProcess: true, updateSuccess: false });
    return this._http.post(TaskTypeUrls.updateTaskType, taskType).pipe(
      map((res: BaseResponseModel<TaskTypeModel>) => {

        this.updateState({ updateInProcess: false, updateSuccess: true });

        this.store.update(state => {

          const preState = cloneDeep(state);
          const typeIndex = preState.types.findIndex((ele)=>ele.id===res.data.id);
          preState.types[typeIndex] = res.data;
          return {
            ...state,
            addNewSuccess: true,
            addNewInProcess: false,
            types: preState.types
          };
        });

        this.notification.success('Success', 'Task Type Updated Successfully');
        return res;
      }),
      catchError(err => {
        this.updateState({ updateInProcess: false, updateSuccess: false });
        return this.handleError(err);
      })
    );
  }

}
