import { Component, OnDestroy, OnInit } from '@angular/core';
import { Task, TaskType, User } from '@aavantan-app/models';
import { NavigationExtras, Router } from '@angular/router';
import { TaskService } from '../shared/services/task/task.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { TaskQuery } from '../queries/task/task.query';
import { GeneralService } from '../shared/services/general.service';

@Component({
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})

export class ProjectComponent implements OnInit, OnDestroy {
  public myTaskList: Task[] = [];
  public allTaskList: Task[] = [];
  public taskObj: Task;
  public memberObj: User;
  public view: String = 'listView';
  public gettingAllTask:boolean;
  public taskTypeDataSource: TaskType[] = [
    {
      id: '1',
      name: 'BUG',
      color: '#F80647'
    },
    {
      id: '2',
      name: 'CR',
      color: '#F0CB2D'
    },
    {
      id: '3',
      name: 'NEW WORK',
      color: '#0E7FE0'
    },
    {
      id: '4',
      name: 'ENHANCEMENTS',
      color: '#0AC93E'
    },
    {
      id: '4',
      name: 'EPIC',
      color: '#1022A8'
    }
  ];

  constructor(private _generalService: GeneralService, private router:Router,private _taskQuery: TaskQuery, private _taskService: TaskService) {
  }

  ngOnInit(): void {

    this._taskService.getAllTask().subscribe();

    this._taskQuery.tasks$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.allTaskList = res;
      }
    });

    this.myTaskList = this.allTaskList.filter((ele)=>{
      return ele.createdBy === this._generalService.user.id;
    })

    console.log('My Task', this.myTaskList.length);
    console.log('All Task', this.allTaskList.length);
  }


  public createTask(item:TaskType) {
    const navigationExtras: NavigationExtras = {
      queryParams: item
    };
    this.router.navigate(["dashboard", "task"], navigationExtras);
  }
  public ngOnDestroy(){
  }
}
