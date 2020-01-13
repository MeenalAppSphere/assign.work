import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IBreadcrumb } from '../shared/interfaces/breadcrumb.type';
import { Observable, of } from 'rxjs';
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { delay } from 'rxjs/operators';
import { JoyrideService } from 'ngx-joyride';
import { GeneralService } from '../shared/services/general.service';
import { OrganizationQuery } from '../queries/organization/organization.query';
import { UserService } from '../shared/services/user/user.service';
import { UserQuery } from '../queries/user/user.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { NzModalService } from 'ng-zorro-antd';
import { AuthService } from '../shared/services/auth.service';
import { cloneDeep } from 'lodash';

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

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private themeService: ThemeConstantService,
              private joyrideService: JoyrideService, private _generalService: GeneralService, private _organizationQuery: OrganizationQuery, private _userService: UserService,
              private _userQuery: UserQuery, private _modalService: NzModalService, private _authService: AuthService) {
  }

  ngOnInit() {

    // listen for user from store
    this._userQuery.user$.subscribe(res => {
      this._generalService.user = cloneDeep(res);
      this.initialCheck();
    });

    // listen for current project
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      this._generalService.currentProject = cloneDeep(res);
    });

    // listen for current organization
    this._userQuery.currentOrganization$.pipe(untilDestroyed(this)).subscribe(res => {
      this._generalService.currentOrganization = cloneDeep(res);
    });

    this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
    this.themeService.isSideNavDarkChanges.subscribe(isDark => this.isSideNavDark = isDark);
    this.themeService.selectedHeaderColor.subscribe(color => this.selectedHeaderColor = color);
    this.themeService.isExpandChanges.subscribe(isExpand => this.isExpand = isExpand);
  }

  projectModalShow(): void {
    if (!this._generalService.currentProject) {
      this.showLogoutWarning('Project');
    } else {
      this.projectModalIsVisible = !this.projectModalIsVisible;
      this.router.navigate(['dashboard', 'project']);
    }
  }

  organizationModalShow(): void {
    if (!this._generalService.user.organizations.length) {
      // show logout popup
      this.showLogoutWarning('Organization');
    } else {
      this.organizationModalIsVisible = !this.organizationModalIsVisible;

      if (this._generalService.user.organizations.length === 1) {
        this.projectModalIsVisible = true;
      } else {
        return;
      }
    }
  }

  stepDone() {
    setTimeout(() => {
      console.log('Step done!');
    }, 3000);
  }

  startTour() {
    const options = {
      steps: ['tour1', 'tour2', 'main-menu', 'tour-card0@dashboard/home', 'tour3', 'board@dashboard/board'],
      startWith: 'tour1',
      // waitingTime: 2000,
      stepDefaultPosition: 'top',
      themeColor: '#000000',
      showPrevButton: true,
      logsEnabled: true,
      customTexts: { prev: of('<<').pipe(delay(2000)), next: '>>' }
    };
    this.joyrideService.startTour(options).subscribe(
      step => {
        console.log('Next:', step);
      },
      e => {
        console.log('Error', e);
      },
      () => {
        this.stepDone();
        console.log('Tour finished');
      }
    );
  }

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
    if ((event.ctrlKey || event.metaKey) && event.which === 74 && !this.projectModalIsVisible) { // CMD+J= Project modal
      event.preventDefault();
      event.stopPropagation();
      this.projectModalShow();
    }
    if ((event.shiftKey || event.metaKey) && event.which === 114 && !this.projectModalIsVisible) { // SHIFT+F3 = Task modal
      event.preventDefault();
      event.stopPropagation();
      this.router.navigateByUrl('dashboard/task');
    }
  }

  private buildBreadCrumb(route: ActivatedRoute, url: string = '', breadcrumbs: IBreadcrumb[] = []): IBreadcrumb[] {
    let label = '', path = '/';
    const display = null;

    if (route.routeConfig) {
      if (route.routeConfig.data) {
        label = route.routeConfig.data['title'];
        path += route.routeConfig.path;
      }
    } else {
      label = 'Dashboard';
      path += 'dashboard';
    }

    const nextUrl = path && path !== '/dashboard' ? `${url}${path}` : url;
    const breadcrumb = <IBreadcrumb>{
      label: label, url: nextUrl
    };

    const newBreadcrumbs = label ? [...breadcrumbs, breadcrumb] : [...breadcrumbs];
    if (route.firstChild) {
      return this.buildBreadCrumb(route.firstChild, nextUrl, newBreadcrumbs);
    }
    return newBreadcrumbs;
  }

  private initialCheck() {

    try {
      if (this._generalService.user) {
        const TaskUrl = this.router.routerState.snapshot.url;
        if (TaskUrl.includes('task/')) {
          this.router.navigateByUrl(TaskUrl);
        } else {
          if (!this._generalService.user.currentOrganization) {
            this.organizationModalIsVisible = true;
          } else {
            if (!this._generalService.user.projects.length && !this._generalService.user.currentProject) {
              this.projectModalIsVisible = true;
            }
          }
        }
      }
    } catch (e) {

    }

  }

  ngOnDestroy(): void {
  }
}
