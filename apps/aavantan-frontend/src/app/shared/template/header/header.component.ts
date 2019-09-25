import { Component, HostListener, OnInit } from '@angular/core';
import { ThemeConstantService } from '../../services/theme-constant.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})

export class HeaderComponent implements OnInit{

  constructor( private themeService: ThemeConstantService) {}

  public modalBasicIsVisible: Boolean = false;
  public searchVisible : Boolean = false;
  public quickViewVisible : Boolean = false;
  public isFolded : boolean;
  public isExpand : boolean;

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
    console.log(event);
    if ((event.ctrlKey || event.composed) && event.which === 74 && !this.modalBasicIsVisible) { // CMD+J
      event.preventDefault();
      event.stopPropagation();
      this.basicModalShow();
    }
  }

  basicModalShow(): void {
    this.modalBasicIsVisible = !this.modalBasicIsVisible;
  }
}
