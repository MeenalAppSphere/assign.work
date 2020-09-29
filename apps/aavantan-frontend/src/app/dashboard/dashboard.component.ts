import { Component, forwardRef, HostListener, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IBreadcrumb } from '../shared/interfaces/breadcrumb.type';
import { Observable, of } from 'rxjs';
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { delay, distinctUntilChanged } from 'rxjs/operators';
import { GeneralService } from '../shared/services/general.service';
import { OrganizationQuery } from '../queries/organization/organization.query';
import { UserService } from '../shared/services/user/user.service';
import { UserQuery } from '../queries/user/user.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { AuthService } from '../shared/services/auth.service';
import { cloneDeep } from 'lodash';
import { InvitationService } from '../shared/services/invitation/invitation.service';
import { TaskPriorityService } from '../shared/services/task-priority/task-priority.service';
import { TaskStatusService } from '../shared/services/task-status/task-status.service';
import { TaskTypeService } from '../shared/services/task-type/task-type.service';
import { BoardService } from '../shared/services/board/board.service';
import { ProjectQuery } from '../queries/project/project.query';
import { ProjectService } from '../shared/services/project/project.service';
import { Socket } from 'ngx-socket-io';
import { NotificationResponseModel, NotificationTypeEnum, Organization, Project, User } from '@aavantan-app/models';

@Component({
  templateUrl: './dashboard.component.html'
})

export class DashboardComponent implements OnInit, OnDestroy {
  breadcrumbs$: Observable<IBreadcrumb[]>;
  contentHeaderDisplay: String = 'none';
  isFolded: boolean;
  isSideNavDark: boolean;
  isExpand: boolean;
  selectedHeaderColor: string;
  projectModalIsVisible: boolean = false;
  organizationModalIsVisible: boolean = false;
  isAcceptInvitationInProcess: boolean = false;
  user: User;
  currentProject: Project;
  currentOrganization: Organization;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private themeService: ThemeConstantService,
              private _generalService: GeneralService, private _organizationQuery: OrganizationQuery,
              private _userService: UserService, private _userQuery: UserQuery, private _modalService: NzModalService, private _authService: AuthService,
              private _invitationService: InvitationService, private _notificationService: NzNotificationService, private _projectQuery: ProjectQuery,
               private _taskPriorityService: TaskPriorityService, private _taskStatusService: TaskStatusService, private _projectService: ProjectService,
              private _taskTypeService: TaskTypeService, private _boardService: BoardService, private socket: Socket,
              private ngZone: NgZone) {
  }

  ngOnInit() {
    this.initializeSocketListeners();

    // listen for user from store
    this._userQuery.user$.pipe(
      untilDestroyed(this)
    ).subscribe(res => {
      this._generalService.user = cloneDeep(res);
      this.user = cloneDeep(res);
      this.initialCheck();
    });

    // listen for current project
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      this._generalService.currentProject = cloneDeep(res);
      this.currentProject = cloneDeep(res);
    });

    // listen for new project created successfully
    this._projectQuery.createProjectSuccess$.pipe(untilDestroyed(this)).subscribe(projectCreated => {
      if (projectCreated) {
        // get initial data when new project created
        this.getInitialData();
      }
    });

    // listen for current organization
    this._userQuery.currentOrganization$.pipe(untilDestroyed(this)).subscribe(res => {
      this._generalService.currentOrganization = cloneDeep(res);
      this.currentOrganization = cloneDeep(res);
    });

    this.themeService.isMenuFoldedChanges.pipe(untilDestroyed(this)).subscribe(isFolded => this.isFolded = isFolded);
    this.themeService.isSideNavDarkChanges.pipe(untilDestroyed(this)).subscribe(isDark => this.isSideNavDark = isDark);
    this.themeService.selectedHeaderColor.pipe(untilDestroyed(this)).subscribe(color => this.selectedHeaderColor = color);
    this.themeService.isExpandChanges.pipe(untilDestroyed(this)).subscribe(isExpand => this.isExpand = isExpand);
  }

  private initializeSocketListeners() {
    // socket connection success
    this.socket.on(NotificationTypeEnum.connectionSuccess, () => {
      if (this.user) {
        this.socket.emit(NotificationTypeEnum.userConnected, this.user._id);
      }
    });

    // task created
    this.socket.on(NotificationTypeEnum.taskAdded, (res: { msg: string, link: string }) => {
      this.createDesktopNotification('Task Created', res);
    });

    // task assigned
    this.socket.on(NotificationTypeEnum.taskAssigned, (res: { msg: string, link: string }) => {
      this.createDesktopNotification('Task Assigned', res);
    });

    // task updated
    this.socket.on(NotificationTypeEnum.taskUpdated, (res: { msg: string, link: string }) => {
      this.createDesktopNotification('Task Updated', res);
    });

    // comment added
    this.socket.on(NotificationTypeEnum.commentAdded, (res: { msg: string, link: string }) => {
      this.createDesktopNotification('Comment Added', res);
    });

    // comment updated
    this.socket.on(NotificationTypeEnum.commentUpdated, (res: { msg: string, link: string }) => {
      this.createDesktopNotification('Comment Updated', res);
    });

    // comment pinned
    this.socket.on(NotificationTypeEnum.commentPinned, (res: { msg: string, link: string }) => {
      this.createDesktopNotification('Comment Pinned', res);
    });

    // comment un pinned
    this.socket.on(NotificationTypeEnum.commentUnPinned, (res: { msg: string, link: string }) => {
      this.createDesktopNotification('Comment UnPinned', res);
    });
  }

  projectModalShow(): void {
    if (!this.currentProject) {
      this.showLogoutWarning('Project');
    } else {
      this.projectModalIsVisible = !this.projectModalIsVisible;
    }
  }

  organizationModalShow(): void {
    if (!this.user.organizations.length || !this.user.currentOrganization) {
      // show logout popup
      this.showLogoutWarning('Organization');
    } else {
      this.organizationModalIsVisible = !this.organizationModalIsVisible;
      this.projectModalIsVisible = true;
    }
  }

  stepDone() {
    setTimeout(() => {
      console.log('Step done!');
    }, 3000);
  }

  // startTour() {
  //   const options = {
  //     steps: ['tour1', 'tour2', 'main-menu', 'tour-card0@dashboard/home', 'tour3', 'board@dashboard/running-sprint'],
  //     startWith: 'tour1',
  //     // waitingTime: 2000,
  //     stepDefaultPosition: 'top',
  //     themeColor: '#000000',
  //     showPrevButton: true,
  //     logsEnabled: true,
  //     customTexts: { prev: of('<<').pipe(delay(2000)), next: '>>' }
  //   };
  //   this.joyrideService.startTour(options).subscribe(
  //     step => {
  //       console.log('Next:', step);
  //     },
  //     e => {
  //       console.log('Error', e);
  //     },
  //     () => {
  //       this.stepDone();
  //       console.log('Tour finished');
  //     }
  //   );
  // }

  showLogoutWarning(type: 'Organization' | 'Project') {
    this._modalService.confirm({
      nzContent: `<p>You need at least one <b>${type}</b> to continue, otherwise you will be logged out of application</p>`,
      nzTitle: 'Warning',
      nzOnOk: () => {
        this._authService.logOut();
      },
      nzOnCancel: () => {
        return;
      }
    });
  }

  // Ctrl + j functionality
  @HostListener('document:keydown', ['$event'])
  public handleKeyboardUpEvent(event: KeyboardEvent) {
    // tslint:disable-next-line: deprecation
    if ((event.ctrlKey || event.metaKey) && event.which === 74 && !this.projectModalIsVisible) { // CMD+J= Project modal
      event.preventDefault();
      event.stopPropagation();
      this.projectModalShow();
    }

    // if ((event.ctrlKey || event.metaKey) && event.which === 75 && !this.organizationModalIsVisible) { // CMD+k= Organization modal
    //   event.preventDefault();
    //   this.organizationModalIsVisible = true;
    //   event.stopPropagation();
    // }
  }

  private async initialCheck() {

    try {
      if (this.user) {
        // get query params from url
        const queryParams = this.activatedRoute.snapshot.queryParams;

        // check url have invitation id
        if (queryParams.invitationId) {
          // start accept invitation process
          this.isAcceptInvitationInProcess = true;
          try {
            // call accept invitation api
            await this._invitationService.acceptInvitation(queryParams.invitationId).toPromise();
            // navigate to dash board after successfully accepting invitation
            this.router.navigate(['dashboard'], { replaceUrl: true });

            // get user profile
            await this._userService.getProfile().toPromise();
            this.isAcceptInvitationInProcess = false;
          } catch (e) {
            // reset flags and update url
            this.isAcceptInvitationInProcess = false;
            this.router.navigate(['dashboard'], { replaceUrl: true });
          }

        } else {
          const TaskUrl = this.router.routerState.snapshot.url;
          // check url contains task id
          if (TaskUrl.includes('task/')) {
            this.router.navigateByUrl(TaskUrl);

            // wrapped in set timeout because we need to wait till all data processed from store
            setTimeout(() => {
              this.getInitialData();
            }, 500);

          } else {

            // check if user have organization
            if (!this.user.currentOrganization) {
              this.organizationModalIsVisible = true;
            } else {
              // check if user have project
              if (!this.user.projects.length || !this.user.currentProject) {
                this.projectModalIsVisible = true;
              } else {
                // now every thing seems good now get initial data
                // wrapped in set timeout because we need to wait till all data processed from store
                setTimeout(() => {
                  this.getInitialData();
                }, 500);
              }
            }
          }
        }

      }

    } catch (e) {
      this._notificationService.error('Error', 'Invalid user login');
      this.router.navigate(['login']);
    }
  }

  private getInitialData() {
    if (this.currentProject) {

      // get all task statuses
      this._taskStatusService.getAllTaskStatuses(this.currentProject.id).subscribe();

      // get all task types
      this._taskTypeService.getAllTaskTypes(this.currentProject.id).subscribe();

      // get all task priorities
      this._taskPriorityService.getAllTaskPriorities(this.currentProject.id).subscribe();

    }

    // get all project limit 10 for header dropdown init
    this._projectService
      .getAllProject({ organizationId: this.currentOrganization.id }).subscribe();

  }

  /**
   * create desktop notification
   * @param {string} title
   * @param {NotificationResponseModel} res
   */
  private createDesktopNotification(title: string, res: NotificationResponseModel) {
    const notification = new Notification(title, {
      body: res.msg,
      icon: 'assets/images/logo/logo.png',
      vibrate: 1
    });

    notification.onclick = ((ev: Event) => {
      this.goToLink(res.link);
      notification.close();
    });
  }

  /**
   * go to link when an notification is clicked
   * @param {string} link
   */
  private goToLink(link: string) {
    this.ngZone.run(() => {
      this.router.navigateByUrl(link);
    });
  }

  ngOnDestroy(): void {
    this._projectService.unsetStoreFlags();
    this.socket.emit('disconnect');
  }
}
