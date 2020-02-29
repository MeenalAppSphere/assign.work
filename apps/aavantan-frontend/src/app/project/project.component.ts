import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  GetAllTaskRequestModel,
  Task,
  TaskFilterCondition,
  TaskFilterModel,
  TaskTypeModel,
  User
} from '@aavantan-app/models';
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
  public getMyTaskInProcess: boolean = true;
  public getTaskInProcess: boolean = true;

  public allTaskFilterRequest: TaskFilterModel;
  public myTaskFilterRequest: TaskFilterModel;

  constructor(protected notification: NzNotificationService,
              private _generalService: GeneralService,
              private _userQuery: UserQuery,
              private router: Router,
              private _taskQuery: TaskQuery,
              private _taskService: TaskService,
              private _taskTypeQuery: TaskTypeQuery) {

    this.allTaskFilterRequest = new TaskFilterModel(this._generalService.currentProject.id);
    this.myTaskFilterRequest = new TaskFilterModel(this._generalService.currentProject.id);

  }

  ngOnInit(): void {
    this._taskTypeQuery.types$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.taskTypeDataSource = res;
      }
    });

    if (this._generalService.currentProject) {

      // get my tasks only
      this.myTaskFilterRequest.queries = [{
        key: 'createdById', value: [this._generalService.user._id], condition: TaskFilterCondition.or
      }, {
        key: 'assigneeId', value: [this._generalService.user._id], condition: TaskFilterCondition.or
      }];

      this.getAllTasks();
      this.getMyTasks();
    }

    // console.log('My Task', this.myTaskList.length);
    // console.log('All Task', this.allTaskList.length);
  }

  getAllTasks() {
    this.getTaskInProcess = true;
    this._taskService.getTaskWithFilter(this.allTaskFilterRequest).subscribe(result => {
      this.getTaskInProcess = false;
      if (result) {
        this.allTaskList = result.data.items;
      } else {
        this.allTaskList = [];
      }
    }, error => {
      this.getTaskInProcess = false;
      this.allTaskList = [];
    });
    // const json: GetAllTaskRequestModel = {
    //   projectId: this._generalService.currentProject.id,
    //   sort: 'createdAt',
    //   sortBy: 'desc'
    // };
    // this.getTaskInProcess = true;
    // this._taskService.getAllTask(json).subscribe();
    // this._taskQuery.tasks$.pipe(untilDestroyed(this)).subscribe(res => {
    //   if (res) {
    //     this.getTaskInProcess = false;
    //
    //     this.allTaskList = res;
    //
    //     this.myTaskList = this.allTaskList.filter((ele: Task) => {
    //       return (ele.createdBy as User).emailId === this._generalService.user.emailId;
    //     });
    //
    //   }
    //
    // });
  }

  getMyTasks() {
    this.getMyTaskInProcess = true;

    this._taskService.getTaskWithFilter(this.myTaskFilterRequest, true).subscribe(result => {
      this.getMyTaskInProcess = false;

      if (result) {
        this.myTaskFilterRequest.page = result.data.page;
        this.myTaskFilterRequest.count = result.data.count;
        this.myTaskFilterRequest.totalItems = result.data.totalItems;
        this.myTaskFilterRequest.totalPages = result.data.totalPages;

        this.myTaskList = result.data.items;
      } else {
        this.myTaskList = [];
      }
    }, error => {
      this.getMyTaskInProcess = false;
      this.myTaskList = [];
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
