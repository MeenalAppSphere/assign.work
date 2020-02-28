import { BaseService } from '../base.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { catchError, map } from 'rxjs/operators';
import { BaseResponseModel, TaskPriorityModel } from '@aavantan-app/models';
import { Observable } from 'rxjs';
import { TaskUrls } from '../task/task.url';
import { TaskPriorityState, TaskPriorityStore } from '../../../store/task-priority/task-priority.store';
import { TaskPriorityUrls } from './task-priority.url';

export class TaskPriorityService extends BaseService<TaskPriorityStore, TaskPriorityState> {
  constructor(protected notification: NzNotificationService, protected taskPriorityStore: TaskPriorityStore, private _http: HttpWrapperService, private _generalService: GeneralService) {
    super(taskPriorityStore, notification);

    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  getAllTaskPriorities(projectId: string) {
    this.updateState({ priorities: [], getAllInProcess: true, getAllSuccess: false });
    return this._http.post(TaskPriorityUrls.getAllTaskPriorities, { projectId }).pipe(
      map((res: BaseResponseModel<TaskPriorityModel[]>) => {
        this.updateState({ priorities: res.data, getAllInProcess: false, getAllSuccess: true });
      }),
      catchError((e) => {
        this.updateState({ priorities: [], getAllInProcess: false, getAllSuccess: false });
        return this.handleError(e);
      })
    );
  }

  createTaskPriority(taskPriority: TaskPriorityModel): Observable<BaseResponseModel<TaskPriorityModel>> {
    this.updateState({ addNewInProcess: true, addNewSuccess: false });
    return this._http.post(TaskPriorityUrls.addTaskPriority, taskPriority).pipe(
      map((res: BaseResponseModel<TaskPriorityModel>) => {

        this.store.update(state => {
          return {
            ...state,
            addNewSuccess: true,
            addNewInProcess: false,
            priorities: [...state.priorities, res.data]
          };
        });

        this.notification.success('Success', 'Task Priority Created Successfully');
        return res;
      }),
      catchError(err => {
        this.updateState({ addNewInProcess: false, addNewSuccess: false });
        return this.handleError(err);
      })
    );
  }

  updateTaskType(taskPriority: TaskPriorityModel): Observable<BaseResponseModel<TaskPriorityModel>> {
    this.updateState({ updateInProcess: true, updateSuccess: false });
    return this._http.post(TaskUrls.addTask, taskPriority).pipe(
      map((res: BaseResponseModel<TaskPriorityModel>) => {
        this.updateState({ updateInProcess: false, updateSuccess: true });
        this.notification.success('Success', 'Task Priority Updated Successfully');
        return res;
      }),
      catchError(err => {
        this.updateState({ updateInProcess: false, updateSuccess: false });
        return this.handleError(err);
      })
    );
  }

}
