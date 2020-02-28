import { Component, OnDestroy, OnInit } from '@angular/core';
import { GetAllTaskRequestModel, Task, TaskTypeModel, User } from '@aavantan-app/models';
import { Router } from '@angular/router';
import { TaskService } from '../shared/services/task/task.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { TaskQuery } from '../queries/task/task.query';
import { GeneralService } from '../shared/services/general.service';
import { UserQuery } from '../queries/user/user.query';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskTypeQuery } from '../queries/task-type/task-type.query';

@Component({
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})

export class ProjectComponent implements OnInit, OnDestroy {
  public myTaskList: Task[] = [];
  public allTaskList: Task[] = [];
  public view: String = 'listView';
  public taskTypeDataSource: TaskTypeModel[] = [];
  public getTaskInProcess: boolean = true;

  constructor(protected notification: NzNotificationService,
              private _generalService: GeneralService,
              private _userQuery: UserQuery,
              private router: Router,
              private _taskQuery: TaskQuery,
              private _taskService: TaskService,
              private _taskTypeQuery: TaskTypeQuery) {
  }

  ngOnInit(): void {

    this._taskTypeQuery.types$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.taskTypeDataSource = res;
      }
    });

    if (this._generalService.currentProject) {
      this.getAllProject();
    }

    // console.log('My Task', this.myTaskList.length);
    // console.log('All Task', this.allTaskList.length);
  }

  getAllProject() {
    const json: GetAllTaskRequestModel = {
      projectId: this._generalService.currentProject.id,
      sort: 'createdAt',
      sortBy: 'desc'
    };
    this.getTaskInProcess = true;
    this._taskService.getAllTask(json).subscribe();

    this._taskQuery.tasks$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.getTaskInProcess = false;

        this.allTaskList = res;

        this.myTaskList = this.allTaskList.filter((ele: Task) => {
          return (ele.createdBy as User).emailId === this._generalService.user.emailId;
        });

      }

    });
  }

  public createTask(item?: TaskTypeModel) {
    let displayName: string = null;

    if (this.taskTypeDataSource[0] && this.taskTypeDataSource[0].displayName) {
      displayName = this.taskTypeDataSource[0].displayName;
    }

    if (item && item.displayName) {
      displayName = item.displayName;
    }

    if (!displayName) {
      this.notification.error('Info', 'Please create task types from settings');
      setTimeout(() => {
        this.router.navigateByUrl('dashboard/settings');
      }, 1000);
      return;
    }

    this.router.navigateByUrl('dashboard/task/' + displayName);
  }

  public ngOnDestroy() {
  }

}
