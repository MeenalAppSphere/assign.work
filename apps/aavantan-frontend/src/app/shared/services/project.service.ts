import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { ProjectState, ProjectStore } from '../../store/project/project.store';
import { HttpWrapperService } from './httpWrapper.service';
import { GeneralService } from './general.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd';
import { ProjectUrls } from './apiUrls/project.url';
import { BaseResponseModel, Project, ProjectMembers } from '@aavantan-app/models';
import { catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { UserStore } from '../../store/user/user.store';

@Injectable()
export class ProjectService extends BaseService<ProjectStore, ProjectState> {
  constructor(protected projectStore: ProjectStore, private _http: HttpWrapperService, private _generalService: GeneralService, private router: Router,
              protected notification: NzNotificationService, private userStore: UserStore) {
    super(projectStore, notification);
  }

  createProject(model: Project): Observable<BaseResponseModel<Project>> {
    return this._http.post(ProjectUrls.base, model).pipe(
      map(res => {
        return res;
      }),
      catchError(err => {
        return err;
      })
    );
  }

  updateProject(id: string, model: Partial<Project>): Observable<BaseResponseModel<Project>> {
    return this._http.put(ProjectUrls.updateProject.replace(':projectId', id), model).pipe(
      map(res => {
        this.userStore.update((state) => {
          return {
            ...state,
            user: {
              ...state.user,
              currentProject: res.data
            }
          };
        });
        this.notification.success('Project Updated', 'Project Settings Updated');
        return res;
      }),
      catchError(err => {
        return err;
      })
    );
  }

  addCollaborators(id: string, members: ProjectMembers[]) {
    return this._http.put(ProjectUrls.addCollaborators.replace(':projectId', id), members).pipe(
      map(res => {
        return res;
      }),
      catchError(e => {
        return e;
      })
    );
  }

  removeCollaborators() {

  }
}
