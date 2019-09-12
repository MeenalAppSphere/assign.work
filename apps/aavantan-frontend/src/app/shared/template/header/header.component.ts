import { Component, HostListener, OnInit } from '@angular/core';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})

export class HeaderComponent implements OnInit{

  public modalBasicIsVisible: Boolean = false;
  public modalBasicCode: any;

  public searchVisible : Boolean = false;
  public quickViewVisible : Boolean = false;
  public isFolded : boolean;
  public isExpand : boolean;

  constructor( private themeService: ThemeConstantService, private firstFB: FormBuilder) {}

  ngOnInit(): void {
    this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
    this.themeService.isExpandChanges.subscribe(isExpand => this.isExpand = isExpand);
    this.creatFrom();
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
      color: 'ant-avatar-' + 'gold'
    }
  ];

  // Ctrl + j functionality
  @HostListener('document:keydown', ['$event'])
  public handleKeyboardUpEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.composed) && event.which === 74 && !this.modalBasicIsVisible) {
      event.preventDefault();
      event.stopPropagation();
      this.basicModalShow();
    }
  }

  basicModalShow(): void {
    this.modalBasicIsVisible = true;
  }

  basicModalHandleOk(): void {
    console.log('Button ok clicked!');
    this.modalBasicIsVisible = false;
  }

  basicModalHandleCancel(): void {
    console.log('Button cancel clicked!');
    this.modalBasicIsVisible = false;
  }



  // create a new component for project modal and put all

  public creatFrom(){
    this.FirstForm = this.firstFB.group({
      projectName            : [ null, [ Validators.email ] ],
      description         : [ null, [ Validators.required ] ]
    });
  }

  public FirstForm: FormGroup;
  public basicCurrent = 1;
  public swicthStepCurrent = 0;
  public index = 'Project Details';
  public radioValue='A';


  pre(): void {
    this.swicthStepCurrent -= 1;
    this.changeContent();
  }

  next(): void {
    this.swicthStepCurrent += 1;
    this.changeContent();
  }

  done(): void {
    console.log('done');
  }

  changeContent(): void {
    switch (this.swicthStepCurrent) {
      case 0: {
        this.index = 'Project Details';
        break;
      }
      case 1: {
        this.index = 'Organization';
        break;
      }
      case 2: {
        this.index = 'Collaborators';
        break;
      }
      case 3: {
        this.index = 'Template';
        break;
      }
      default: {
        this.index = 'error';
      }
    }
  }


}
