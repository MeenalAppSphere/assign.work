import { Component, OnDestroy, OnInit } from '@angular/core';
import { Task, TaskType, User } from '@aavantan-app/models';
import { NavigationExtras, Router } from '@angular/router';
import { TaskService } from '../shared/services/task/task.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { TaskQuery } from '../queries/task/task.query';
import { GeneralService } from '../shared/services/general.service';
import { UserQuery } from '../queries/user/user.query';
import { NzNotificationService } from 'ng-zorro-antd';

@Component({
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})

export class ProjectComponent implements OnInit, OnDestroy {
  public myTaskList: Task[] = [];
  public allTaskList: Task[] = [];
  public view: String = 'listView';
  public taskTypeDataSource: TaskType[] = [];

  constructor(protected notification: NzNotificationService, private _generalService: GeneralService, private _userQuery: UserQuery, private router:Router,private _taskQuery: TaskQuery, private _taskService: TaskService) {
  }

  ngOnInit(): void {

    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.taskTypeDataSource = res.settings.taskTypes;
      }
    });

    this._taskService.getAllTask().subscribe();

    this._taskQuery.tasks$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.allTaskList = res;

        this.myTaskList = this.allTaskList.filter((ele:Task) => {
          return (ele.createdBy as User).emailId === this._generalService.user.emailId;
        });

      }
    });

    console.log('My Task', this.myTaskList.length);
    console.log('All Task', this.allTaskList.length);
  }


  public createTask(item:TaskType) {
    if(!item.displayName && this.taskTypeDataSource[0] && this.taskTypeDataSource[0].displayName){
      item.displayName=this.taskTypeDataSource[0].displayName;
    }
    if(!item.displayName){
      this.notification.error('Error', 'Please create task types from settings');
      return
    }
    this.router.navigateByUrl("dashboard/task/"+item.displayName);
  }

  public ngOnDestroy(){
  }

}
