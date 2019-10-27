import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { GeneralService } from '../../services/general.service';
import { OrganizationQuery } from '../../../queries/organization/organization.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Organization, Project } from '@aavantan-app/models';
import { UserService } from '../../services/user/user.service';
import { UserQuery } from '../../../queries/user/user.query';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit, OnDestroy {
  public currentProject: Project = null;

  constructor(private themeService: ThemeConstantService, private router: Router, private readonly _authService: AuthService,
              private readonly _generalService: GeneralService, private _organizationQuery: OrganizationQuery, private _userService: UserService,
              private _userQuery: UserQuery) {
  }

  public projectModalIsVisible: boolean = false;
  public organizationModalIsVisible: boolean = false;
  public searchVisible: boolean = false;
  public quickViewVisible: boolean = false;
  public isFolded: boolean;
  public isExpand: boolean;
  public selectedOrgId: string = null;

  notificationList = [
    {
      title: 'You received a new message',
      time: '8 min',
      icon: 'mail',
      color: 'ant-avatar-' + 'blue'
    },
    {
      title: 'New user registered',
      time: '7 hours',
      icon: 'user-add',
      color: 'ant-avatar-' + 'cyan'
    },
    {
      title: 'System Alert',
      time: '8 hours',
      icon: 'warning',
      color: 'ant-avatar-' + 'red'
    },
    {
      title: 'You have a new update',
      time: '2 days',
      icon: 'sync',
      color: 'ant-avatbasicModalHandleCancelar-' + 'gold'
    }
  ];

  ngOnInit(): void {

    // listen for user from store
    this._userQuery.user$.subscribe(res => {
      this._generalService.user = res;

      this.initialCheck();
    });

    // listen for current project
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      this.currentProject = res;
    });

    // listen for organization create success
    this._organizationQuery.isCreateOrganizationSuccess$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        const lastOrganization = this._generalService.user.organizations[this._generalService.user.organizations.length - 1];
        this.selectedOrgId = (lastOrganization as Organization).id;
      } else {
        this.selectedOrgId = null;
      }
    });

    this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
    this.themeService.isExpandChanges.subscribe(isExpand => this.isExpand = isExpand);
  }

  toggleFold() {
    this.isFolded = !this.isFolded;
    this.themeService.toggleFold(this.isFolded);
  }

  toggleExpand() {
    this.isFolded = false;
    this.isExpand = !this.isExpand;
    this.themeService.toggleExpand(this.isExpand);
    this.themeService.toggleFold(this.isFolded);
  }

  searchToggle(): void {
    this.searchVisible = !this.searchVisible;
  }

  quickViewToggle(): void {
    this.quickViewVisible = !this.quickViewVisible;
  }

  // Ctrl + j functionality
  @HostListener('document:keydown', ['$event'])
  public handleKeyboardUpEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.which === 74 && !this.projectModalIsVisible) { // CMD+J= Project modal
      event.preventDefault();
      event.stopPropagation();
      // this.organizationModalShow();
      this.projectModalShow();
    }
    if ((event.shiftKey || event.metaKey) && event.which === 114 && !this.projectModalIsVisible) { // SHIFT+F3 = Task modal
      event.preventDefault();
      event.stopPropagation();
      this.router.navigateByUrl('dashboard/task');
    }
  }

  public projectModalShow(): void {
    this.projectModalIsVisible = !this.projectModalIsVisible;
  }

  public organizationModalShow(): void {
    this.organizationModalIsVisible = !this.organizationModalIsVisible;
  }

  logOut() {
    this._authService.logOut();
  }

  private initialCheck() {
    if (this._generalService.user) {
      if (!this._generalService.user.organizations.length) {
        this.organizationModalShow();
      } else {
        if (!this._generalService.user.projects.length) {
          // if user have no projects show create project dialog
          const lastOrganization = this._generalService.user.organizations[this._generalService.user.organizations.length - 1];
          this.selectedOrgId = (lastOrganization as Organization).id;
          this.projectModalShow();
        }
      }
    }
  }

  ngOnDestroy(): void {
  }
}
