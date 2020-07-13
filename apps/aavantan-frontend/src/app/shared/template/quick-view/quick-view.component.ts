import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-quick-view',
    templateUrl: './quick-view.component.html'
})



export class QuickViewComponent implements OnInit {

  public customStyle =  {
    background: '#f7f7f7',
    'border-radius': '4px',
    'margin-bottom': '3px',
  }

  public projects = [
      {
        id:'1',
        active: true,
        disabled: false,
        name: 'Project 1',
        notificationCount:10,
      },
      {
        id:'2',
        active: false,
        disabled: true,
        name: 'Project 2',
        notificationCount:99,
      },
      {
        id:'3',
        active: false,
        disabled: false,
        name: 'Project 3',
        notificationCount:0,
      }
    ];

  public isLoadingInProgress:boolean;
  public notifications: { name:string, url:string }[] = [
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    },
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    },
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    },
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    },
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    },
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    },
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    },
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    },
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    },
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    },
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    },
    {
      name:'TASK-199 assigne to you',
      url:'http://assign.work/dashboard/task/TASK-199'
    }
  ];

  ngOnInit(): void {

  }
  read(item: any): void {

  }
}

