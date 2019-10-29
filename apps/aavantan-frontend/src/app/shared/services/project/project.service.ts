import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { ProjectState, ProjectStore } from '../../../store/project/project.store';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd';
import { ProjectUrls } from './project.url';
import { BaseResponseModel, Project, ProjectMembers, ProjectStages, TaskType } from '@aavantan-app/models';
import { catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { UserStore } from '../../../store/user/user.store';

@Injectable()
export class ProjectService extends BaseService<ProjectStore, ProjectState> {
  constructor(protected projectStore: ProjectStore, private _http: HttpWrapperService, private _generalService: GeneralService, private router: Router,
              protected notification: NzNotificationService, private userStore: UserStore) {
    super(projectStore, notification);
  }

  createProject(model: Project): Observable<BaseResponseModel<Project>> {
    return this._http.post(ProjectUrls.base, model).pipe(
      map((res: BaseResponseModel<Project>) => {
        if (!this._generalService.user.projects.length) {
          this.updateCurrentProjectState(res.data);
        }
        this._generalService.user.projects.push(res.data as any);
        return res;
      }),
      catchError(err => {
        return this.handleError(err);
      })
    );
  }

  updateProject(id: string, model: Partial<Project>): Observable<BaseResponseModel<Project>> {
    return this._http.put(ProjectUrls.updateProject.replace(':projectId', id), model).pipe(
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

  removeCollaborators() {

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

  addTaskType(id: string, taskType: TaskType): Observable<BaseResponseModel<Project>> {
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

  private updateCurrentProjectState(result: Project) {
    this.userStore.update((state => {
      return {
        ...state,
        currentProject: result
      };
    }));
  }
}
