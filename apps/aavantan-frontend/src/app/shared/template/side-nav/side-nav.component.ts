import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ROUTES } from './side-nav-routes.config';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { Organization, TaskTypeModel } from '@aavantan-app/models';
import { UserQuery } from '../../../queries/user/user.query';
import { Router } from '@angular/router';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { NzNotificationService } from 'ng-zorro-antd';
import { OrganizationService } from '../../services/organization/organization.service';
import { TaskTypeQuery } from '../../../queries/task-type/task-type.query';
import { TaskService } from '../../services/task/task.service';
import { ProjectService } from '../../services/project/project.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})

export class SideNavComponent implements OnInit, OnDestroy {

  public selectedHeaderColor: string;
  public isExpand: boolean;
  public menuItems: any[];
  public adminMenuItems: any[];
  isFolded: boolean;
  isSideNavDark: boolean;
  public taskTypeDataSource: TaskTypeModel[] = [];
  public currentOrganization: Organization;
  public organizations: string[] | Organization[] = [];
  public switchOrganizationInProcess: boolean;
  public displayName:string= null;
  public organizationModalIsVisible:boolean;

  constructor(private themeService: ThemeConstantService,
              protected notification: NzNotificationService,
              private _userQuery: UserQuery,
              private _organizationService: OrganizationService,
              private _taskService: TaskService,
              private router: Router, private _taskTypeQuery: TaskTypeQuery,
              private _projectService: ProjectService) {

    this._userQuery.user$.pipe(untilDestroyed(this)).subscribe(user => {
      if (user) {
        this.organizations = user.organizations;
      } else {
        this.organizations = [];
      }
    })

    // get all task types from store
    this._taskTypeQuery.types$.pipe(untilDestroyed(this)).subscribe(types => {
      if(types && types.length>0) {
        this.taskTypeDataSource = types;
        this.displayName = this.taskTypeDataSource[0].displayName;
      }
    });

    this._userQuery.currentOrganization$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentOrganization = res;
      }
    });

  }

  ngOnInit(): void {
    this.menuItems = ROUTES.filter(menuItem => menuItem.type !== 'admin');
    this.adminMenuItems = ROUTES.filter(menuItem => menuItem.type === 'admin');
    this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
    this.themeService.isSideNavDarkChanges.subscribe(isDark => this.isSideNavDark = isDark);
    this.themeService.isExpandChanges.pipe(untilDestroyed(this)).subscribe(isExpand => this.isExpand = isExpand);
    this.themeService.isMenuFoldedChanges.pipe(untilDestroyed(this)).subscribe(isFolded => this.isFolded = isFolded);
    this.themeService.isSideNavDarkChanges.pipe(untilDestroyed(this)).subscribe(isDark => this.isSideNavDark = isDark);
    this.themeService.selectedHeaderColor.pipe(untilDestroyed(this)).subscribe(color => this.selectedHeaderColor = color);
  }

  // Ctrl + j functionality
  @HostListener('document:keydown', ['$event'])
  public handleKeyboardUpEvent(event: KeyboardEvent) {
    if (((event.shiftKey || event.metaKey) && event.which === 114) && this.displayName) { // SHIFT+F3 = Task modal
      event.preventDefault();
      event.stopPropagation();
      this._taskService.createNewTaskAction();
      this.router.navigateByUrl('dashboard/task/' + this.displayName);
    }
  }

  public createNewTask(item?: TaskTypeModel) {

    if (this.taskTypeDataSource[0] && this.taskTypeDataSource[0].displayName) {
      this.displayName = this.taskTypeDataSource[0].displayName;
    }

    if (!this.displayName) {
      this.notification.error('Info', 'Please create Task Types, Status, Priority from settings');
      setTimeout(() => {
        this.router.navigateByUrl('dashboard/settings');
      }, 1000);
      return;
    }
    this._taskService.createNewTaskAction();
    this.router.navigateByUrl('dashboard/task/' + this.displayName);
  }

  public switchOrganization(organizationId: string) {
    try {

      if (this.currentOrganization.id === organizationId) {
        return;
      }

      this.switchOrganizationInProcess = true;

      this._organizationService.switchOrganization(organizationId).subscribe((res => {
        this.switchOrganizationInProcess = false;
      }), (error => {
        this.switchOrganizationInProcess = false;
      }));

    } catch (e) {
      this.switchOrganizationInProcess = false;
    }
  }

  organizationModalShow(): void {
    this.organizationModalIsVisible = !this.organizationModalIsVisible;
  }

  // close side nav on menu click
  public closeSideNav() {
    if (window.innerWidth < 768) {
      this.themeService.toggleExpand(false);
      this.themeService.toggleFold(false);
    } else {
      this.themeService.toggleFold(true);
    }
  }


  public ngOnDestroy() {
  }
}
