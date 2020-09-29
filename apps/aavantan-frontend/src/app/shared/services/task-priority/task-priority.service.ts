//  import { CORE_QUILL_EDITOR_CONFIGURATION_SERVICE } from "@app/core";
//  import { QuillEditorConfigurationServiceImpl } from "@app/core";
// import { CORE_QUILL_EDITOR_CONFIGURATION_SERVICE } from "./services/quill-editor-configuration.service.constants";
// import { QuillEditorConfigurationServiceImpl } from "./services/quill-editor-configuration.service";


import { BaseService } from '../base.service';
import {  NzConfigService, NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { catchError, map } from 'rxjs/operators';
import { BaseResponseModel, Project, ProjectPriority, TaskPriorityModel } from '@aavantan-app/models';
import { Observable } from 'rxjs';
import { TaskUrls } from '../task/task.url';
import { TaskPriorityState, TaskPriorityStore } from '../../../store/task-priority/task-priority.store';
import { TaskPriorityUrls } from './task-priority.url';
import { ProjectUrls } from '../project/project.url';
import { cloneDeep } from 'lodash';
import { Injectable } from '@angular/core';

@Injectable()
export class TaskPriorityService extends BaseService<TaskPriorityStore, TaskPriorityState> {
  constructor(protected notification: NzNotificationService, 
    protected taskPriorityStore: TaskPriorityStore, 
    private _generalService: GeneralService,
    private _http: HttpWrapperService,
    private _configService:NzConfigService ) {

    super(taskPriorityStore, notification);

    //  this.notification.info("message","success",{nzPlacement:'bottomRight'}); 

    // this._configService.set({
    //   nzPlacement: 'bottomRight'
    // });
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

  createPriority(priority: ProjectPriority): Observable<BaseResponseModel<Project>> {
    return this._http.post(TaskPriorityUrls.addPriority, priority)
      .pipe(
        map(res => {

          // add new created priority to store's priority array
          this.taskPriorityStore.update((state) => {
            return {
              ...state,
              addNewSuccess: true,
              addNewInProcess: false,
              priorities: [...state.priorities, res.data]
            };
          });

          this.notification.success('Success', 'Priority Created Successfully');
          return res;
        }),
        catchError(e => this.handleError(e))
      );
  }


  updatePriority(taskPriority: TaskPriorityModel): Observable<BaseResponseModel<TaskPriorityModel>> {
    this.updateState({ updateInProcess: true, updateSuccess: false });
    return this._http.post(TaskPriorityUrls.updatePriority, taskPriority).pipe(
      map((res: BaseResponseModel<TaskPriorityModel>) => {
        this.updateState({ updateInProcess: false, updateSuccess: true });

        this.store.update(state => {

          const preState = cloneDeep(state);
          const index = preState.priorities.findIndex((ele)=>ele.id===res.data.id);
          preState.priorities[index] = res.data;
          return {
            ...state,
            addNewSuccess: true,
            addNewInProcess: false,
            priorities: preState.priorities
          };
        });

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
