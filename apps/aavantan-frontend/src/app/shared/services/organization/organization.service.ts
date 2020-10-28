import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { OrganizationState, OrganizationStore } from '../../../store/organization/organization.store';
import { BaseResponseModel, Organization, User } from '@aavantan-app/models';
import { HttpWrapperService } from '../httpWrapper.service';
import { OrganizationUrls } from './organization.url';
import { catchError, map } from 'rxjs/operators';
import { UserStore } from '../../../store/user/user.store';
import { GeneralService } from '../general.service';
import { Observable, of } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd';
import { Router } from '@angular/router';
import { TaskTypeStore } from '../../../store/task-type/task-type.store';
import { TaskStatusStore } from '../../../store/task-status/task-status.store';
import { TaskPriorityStore } from '../../../store/task-priority/task-priority.store';
import { BoardStore } from '../../../store/board/board.store';
import { ProjectStore } from '../../../store/project/project.store';
import { TaskStore } from '../../../store/task/task.store';
import { SprintStore } from '../../../store/sprint/sprint.store';
import { SprintReportStore } from '../../../store/sprint-report/sprint-report.store';
import { UserService } from '../user/user.service';

@Injectable()
export class OrganizationService extends BaseService<OrganizationStore, OrganizationState> {

  constructor(private readonly _organizationStore: OrganizationStore, private _httpWrapper: HttpWrapperService,
              private _userStore: UserStore, private _generalService: GeneralService, protected notification: NzNotificationService,
              private _router: Router, private taskTypeStore: TaskTypeStore, private taskStatusStore: TaskStatusStore, private taskPriorityStore: TaskPriorityStore,
              private boardStore: BoardStore, private projectStore: ProjectStore, private taskStore: TaskStore,
              private organizationStore: OrganizationStore, private sprintStore: SprintStore, private sprintReportStore: SprintReportStore,
              private userService: UserService) {
    super(_organizationStore, notification);
    // this.notification.info("message","suucess",{nzPlacement:'bottomRight'}); 
    // this.notification.config({
    //   nzPlacement: 'bottomRight'
    // });
  }

  createOrganization(org: Organization) {
    this.updateState({ createOrganizationInProcess: true, createOrganizationSuccess: false });
    return this._httpWrapper.post(OrganizationUrls.base, org).pipe(
      map((res: BaseResponseModel<Organization>) => {

        // no organization means it's current organization
        if (!this._generalService.user.organizations.length) {
          this._generalService.currentOrganization = res.data;
        }

        // update user profile
        this._userStore.update(state => {
          return {
            ...state,
            currentOrganization: res.data,
            user: Object.assign({}, state.user, {
              organizations: [...state.user.organizations, res.data],
              currentOrganization: res.data,
              currentOrganizationId: res.data._id,
              currentProject: null,
              projects: []
            }),
            currentProject: null
          };
        });

        this.updateState({ createOrganizationInProcess: false, createOrganizationSuccess: true });

        this.projectStore.reset();
        this.boardStore.reset();
        this.sprintStore.reset();
        this.sprintReportStore.reset();
        this.taskStore.reset();
        this.taskTypeStore.reset();
        this.taskStatusStore.reset();
        this.taskPriorityStore.reset();
        setTimeout(()=> {this.updateState({ switchOrganizationInProcess: false, switchOrganizationSuccess: false });}, 2000);
        return res;
      }),
      catchError(err => {
        this.updateState({ createOrganizationInProcess: false, createOrganizationSuccess: false });
        return this.handleError(err);
      })
    );
  }

  switchOrganization(organizationId: string) {
    this.updateState({ switchOrganizationInProcess: true, switchOrganizationSuccess: false });
    return this._httpWrapper.post(OrganizationUrls.switchOrganization, { organizationId }).pipe(
      map(res => {
        this._userStore.update((state => {
          return {
            ...state,
            user: res.data,
            currentProject: res.data.currentProject,
            currentOrganization: res.data.currentOrganization
          };
        }));
        this.userService.setPermissions(res.data);
        this.updateState({ switchOrganizationInProcess: false, switchOrganizationSuccess: true });
        this._router.navigate(['dashboard']);
        this.notification.success('Success', 'Organization Switched Successfully');
      }),
      catchError(e => {
        this.updateState({ switchOrganizationInProcess: false, switchOrganizationSuccess: false });
        return this.handleError(e);
      })
    );
  }

  getAllUsers(id: string): Observable<BaseResponseModel<User[]>> {
    return this._httpWrapper.get(OrganizationUrls.users.replace(':orgId', id)).pipe(
      map((res) => {
        return res;
      }),
      catchError((err => of(err)))
    );
  }


  resetOrganizationStore() {
    this.updateState({ createOrganizationInProcess: false, createOrganizationSuccess: false });
  }
}
