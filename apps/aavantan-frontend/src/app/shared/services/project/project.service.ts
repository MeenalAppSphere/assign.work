import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { ProjectState, ProjectStore } from '../../../store/project/project.store';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd';
import { ProjectUrls } from './project.url';
import {
  BaseResponseModel,
  GetAllProjectsModel,
  Project,
  ProjectMembers,
  ProjectPriority,
  ProjectStages,
  ProjectStatus, ProjectTags,
  ProjectTemplateUpdateModel,
  ProjectWorkingCapacityUpdateDto,
  ResendProjectInvitationModel,
  SearchProjectRequest,
  SearchProjectTags,
  SwitchProjectRequest,
  TaskTypeModel,
  User
} from '@aavantan-app/models';
import { catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { UserStore } from '../../../store/user/user.store';
import { cloneDeep } from 'lodash';
import { TaskPriority } from 'aws-sdk/clients/swf';
import { TaskPriorityStore } from '../../../store/task-priority/task-priority.store';


@Injectable()
export class ProjectService extends BaseService<ProjectStore, ProjectState> {
  constructor(protected projectStore: ProjectStore, private _http: HttpWrapperService, private _generalService: GeneralService, private router: Router,
              protected notification: NzNotificationService, private userStore: UserStore, private taskPriorityStore: TaskPriorityStore) {
    super(projectStore, notification);
    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  createProject(model: Project): Observable<BaseResponseModel<Project>> {
    this.updateState({ createProjectInProcess: true, createProjectSuccess: false });
    return this._http.post(ProjectUrls.base, model).pipe(
      map((res: BaseResponseModel<Project>) => {

        this.userStore.update((state => {
          return {
            ...state,
            currentProject: res.data,
            user: Object.assign({}, state.user, {
              projects: [...state.user.projects, res.data]
            })
          };
        }));

        this._generalService.user.currentProject = res.data;

        this.updateState({ createProjectInProcess: false, createProjectSuccess: true });
        this.notification.success('Success', 'Project Created Successfully');
        return res;
      }),
      catchError(err => {
        this.updateState({ createProjectInProcess: false, createProjectSuccess: false });
        return this.handleError(err);
      })
    );
  }

  switchProject(project: SwitchProjectRequest): Observable<BaseResponseModel<User>> {
    this.updateState({ projectSwitchInProcess: true, projectSwitchedSuccessfully: false });
    return this._http.post(ProjectUrls.switchProject, project).pipe(
      map((res: BaseResponseModel<User>) => {

        this.userStore.update((state => {
          return {
            ...state,
            user: res.data,
            currentProject: res.data.currentProject
          };
        }));

        this._generalService.user = cloneDeep(res.data);

        this.updateState({ projectSwitchInProcess: false, projectSwitchedSuccessfully: true });
        this.notification.success('Success', 'Current Project Changed Successfully');
        this.router.navigate(['dashboard']);
        return res;
      }),
      catchError(err => {
        this.updateState({ projectSwitchInProcess: false, projectSwitchedSuccessfully: false });
        return this.handleError(err);
      })
    );
  }

  getAllProject(json: GetAllProjectsModel): Observable<BaseResponseModel<Project[]>> {
    return this._http.post(ProjectUrls.getAllProject, json).pipe(
      map((res: BaseResponseModel<Project[]>) => {
        //this.notification.success('Success', 'Found');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  searchProject(text: string): Observable<BaseResponseModel<Project[]>> {
    const json: SearchProjectRequest = {
      organizationId: this._generalService.currentOrganization.id,
      query: text
    };
    return this._http.post(ProjectUrls.searchProject, json).pipe(
      map((res: BaseResponseModel<Project[]>) => {
        // this.notification.success('Success', 'Found');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  updateProject(model: Partial<Project>): Observable<BaseResponseModel<Project>> {
    return this._http.post(ProjectUrls.updateProject, model).pipe(
      map(res => {
        this.updateCurrentProjectState(res.data);
        this.notification.success('Project Updated', 'Project Settings Updated');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  updateTemplate(model: ProjectTemplateUpdateModel): Observable<BaseResponseModel<Project>> {
    return this._http.post(ProjectUrls.updateTemplate, model).pipe(
      map(res => {
        this.updateCurrentProjectState(res.data);
        this.notification.success('Project Updated', 'Project Template Updated');
        this.router.navigate(['dashboard']);
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  addCollaborators(id: string, members: ProjectMembers[]): Observable<BaseResponseModel<Project>> {
    return this._http.post(ProjectUrls.addCollaborators.replace(':projectId', id), members).pipe(
      map(res => {
        this.updateCurrentProjectState(res.data);
        return res;
      }),
      catchError(e => {
        return this.handleError(e);
      })
    );
  }

  resendInvitation(json: ResendProjectInvitationModel): Observable<BaseResponseModel<string>> {
    return this._http.post(ProjectUrls.resendInvitation, json).pipe(
      map(res => {
        this.notification.success('Invitation', 'Project invitation sent successfully');
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  removeCollaborators(json: any): Observable<BaseResponseModel<Project>> {
    return this._http.post(ProjectUrls.removeCollaborators, json).pipe(
      map(res => {
        this.updateCurrentProjectState(res.data);
        return res;
      }),
      catchError(e => {
        return this.handleError(e);
      })
    );
  }

  addStage(id: string, stage: ProjectStages): Observable<BaseResponseModel<Project>> {
    return this._http.post(ProjectUrls.addStage.replace(':projectId', id), stage)
      .pipe(
        map(res => {
          this.updateCurrentProjectState(res.data);
          this.notification.success('Success', 'Stage Created Successfully');
          return res;
        }),
        catchError(e => this.handleError(e))
      );
  }

  removeStage(id: string, stageid: string): Observable<BaseResponseModel<Project>> {
    return this._http.delete(ProjectUrls.removeStage
      .replace(':projectId', id)
      .replace(':stageId', stageid)
    )
      .pipe(
        map(res => {
          this.updateCurrentProjectState(res.data);
          this.notification.success('Success', 'Stage Deleted Successfully');
          return res;
        }),
        catchError(e => this.handleError(e))
      );
  }

  addStatus(id: string, status: ProjectStatus): Observable<BaseResponseModel<Project>> {
    return this._http.post(ProjectUrls.addStatus.replace(':projectId', id), status)
      .pipe(
        map(res => {
          this.updateCurrentProjectState(res.data);
          this.notification.success('Success', 'Status Created Successfully');
          return res;
        }),
        catchError(e => this.handleError(e))
      );
  }

  removeStatus(id: string, statusId: string): Observable<BaseResponseModel<Project>> {
    return this._http.delete(ProjectUrls.removeStatus
      .replace(':projectId', id)
      .replace(':statusId', statusId)
    )
      .pipe(
        map(res => {
          this.updateCurrentProjectState(res.data);
          this.notification.success('Success', 'Status Deleted Successfully');
          return res;
        }),
        catchError(e => this.handleError(e))
      );
  }

  getAllPriority(projectId: string): Observable<BaseResponseModel<TaskPriority>> {
    return this._http.post(ProjectUrls.getAllPriority, projectId)
      .pipe(
        map(res => {
          return res;
        }),
        catchError(e => this.handleError(e))
      );
  }

  removePriority(projectId: string, priorityId: string): Observable<BaseResponseModel<Project>> {
    return this._http.delete(ProjectUrls.removeTaskType
      .replace(':projectId', projectId)
      .replace(':priorityId', priorityId)
    )
      .pipe(
        map(res => {
          this.updateCurrentProjectState(res.data);
          this.notification.success('Success', 'Priority Removed Successfully');
          return res;
        }),
        catchError(e => this.handleError(e))
      );
  }

  addTaskType(id: string, taskType: TaskTypeModel): Observable<BaseResponseModel<Project>> {
    return this._http.post(ProjectUrls.addTaskType.replace(':projectId', id), taskType)
      .pipe(
        map(res => {
          this.updateCurrentProjectState(res.data);
          this.notification.success('Success', 'Task Type Created Successfully');
          return res;
        }),
        catchError(e => this.handleError(e))
      );
  }

  updateCapacity(projectId: string, json: ProjectWorkingCapacityUpdateDto[]): Observable<BaseResponseModel<Project>> {
    return this._http.put(ProjectUrls.updateCapacity.replace(':projectId', projectId), json)
      .pipe(
        map(res => {
          this.updateCurrentProjectState(res.data);
          this.notification.success('Success', 'Updated Successfully');
          return res;
        }),
        catchError(e => this.handleError(e))
      );
  }

  removeTaskType(id: string, taskTypeId: string): Observable<BaseResponseModel<Project>> {
    return this._http.delete(ProjectUrls.removeTaskType
      .replace(':projectId', id)
      .replace(':taskTypeId', taskTypeId)
    )
      .pipe(
        map(res => {
          this.updateCurrentProjectState(res.data);
          this.notification.success('Success', 'Task Type Deleted Successfully');
          return res;
        }),
        catchError(e => this.handleError(e))
      );
  }

  searchTags(text: string): Observable<BaseResponseModel<ProjectTags[]>> {
    const json: SearchProjectTags = {
      // organizationId: this._generalService.currentOrganization.id,
      projectId: this._generalService.currentProject.id,
      query: text
    };
    return this._http.post(ProjectUrls.searchTags, json).pipe(
      map((res: BaseResponseModel<ProjectTags[]>) => {
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  private updateCurrentProjectState(result: Project) {
    this.userStore.update((state => {
      return {
        ...state,
        currentProject: result
      };
    }));
  }

  unsetStoreFlags() {
    this.updateState({
      createProjectSuccess: false,
      projectSwitchedSuccessfully: false
    });
  }
}
