import { Component, OnDestroy, OnInit } from '@angular/core';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { GeneralService } from '../../services/general.service';
import { OrganizationQuery } from '../../../queries/organization/organization.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Organization, Project, User } from '@aavantan-app/models';
import { UserService } from '../../services/user/user.service';
import { UserQuery } from '../../../queries/user/user.query';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit, OnDestroy {
  public currentProject: Project = null;
  public currentUser: User = null;

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
    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentProject = res;
      }
    });
    this._userQuery.user$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentUser = res;
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

  public projectModalShow(): void {
    this.projectModalIsVisible = !this.projectModalIsVisible;
  }

  public organizationModalShow(): void {
    this.organizationModalIsVisible = !this.organizationModalIsVisible;
  }

  logOut() {
    this._authService.logOut();
  }

  ngOnDestroy(): void {
  }
}
