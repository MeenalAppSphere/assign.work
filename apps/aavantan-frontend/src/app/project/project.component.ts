import { Component, OnDestroy, OnInit } from '@angular/core';
import { GetAllTaskRequestModel, Task, TaskType, User } from '@aavantan-app/models';
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
  public getTaskInProcess: boolean= true;

  constructor(protected notification: NzNotificationService,
              private _generalService: GeneralService,
              private _userQuery: UserQuery,
              private router:Router,
              private _taskQuery: TaskQuery,
              private _taskService: TaskService) {
  }

  ngOnInit(): void {

    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.taskTypeDataSource = res.settings.taskTypes;
      }
    });

    const json: GetAllTaskRequestModel = {
      projectId: this._generalService.currentProject.id,
      sort: 'createdAt',
      sortBy: 'desc'
    };
    this.getTaskInProcess=true;
    this._taskService.getAllTask(json).subscribe();

    this._taskQuery.tasks$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.getTaskInProcess=false;

        this.allTaskList = res;

        this.myTaskList = this.allTaskList.filter((ele:Task) => {
          return (ele.createdBy as User).emailId === this._generalService.user.emailId;
        });

      }

    });

    // console.log('My Task', this.myTaskList.length);
    // console.log('All Task', this.allTaskList.length);
  }


  public createTask(item?:TaskType) {
    let displayName:string = null;

    if(this.taskTypeDataSource[0] && this.taskTypeDataSource[0].displayName){
      displayName=this.taskTypeDataSource[0].displayName;
    }

    if(item && item.displayName){
      displayName = item.displayName;
    }

    if(!displayName){
      this.notification.error('Info', 'Please create task types from settings');
      setTimeout(()=>{
        this.router.navigateByUrl("dashboard/settings");
      },1000);
      return
    }

    this.router.navigateByUrl("dashboard/task/"+displayName);
  }

  public ngOnDestroy(){
  }

}
