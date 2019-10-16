import { Component, HostListener, OnInit } from '@angular/core';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { GeneralService } from '../../services/general.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {

  constructor(private themeService: ThemeConstantService, private router: Router, private readonly _authService: AuthService,
              private readonly _generalService: GeneralService) {
  }

  public projectModalIsVisible: boolean = false;
  public organizationModalIsVisible: boolean = false;
  public searchVisible: boolean = false;
  public quickViewVisible: boolean = false;
  public isFolded: boolean;
  public isExpand: boolean;

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

    if (this._generalService.user) {
      if (!this._generalService.user.organizations.length) {
        this.organizationModalShow();
      } else {
        if (!this._generalService.user.projects.length) {
          this.projectModalShow();
        }
      }
    }

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
      this.organizationModalShow();
      //this.projectModalShow();
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
}
