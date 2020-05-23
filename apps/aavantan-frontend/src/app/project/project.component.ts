import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  Project,
  StatusDDLModel,
  Task,
  TaskFilterCondition,
  TaskFilterModel, TaskStatusModel,
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
import { cloneDeep } from 'lodash';
import { TaskStatusQuery } from '../queries/task-status/task-status.query';

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
  public activeTab: string= 'my';

  public isFilterApplied: boolean;
  public statusColumnDataSource: StatusDDLModel[] = [];
  public selectedColumnDataSource: string[] = [];
  public currentProject: Project;

  constructor(protected notification: NzNotificationService,
              private _generalService: GeneralService,
              private _userQuery: UserQuery,
              private router: Router,
              private _taskQuery: TaskQuery,
              private _taskStatusQuery: TaskStatusQuery,
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

    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentProject = res;
      }
    });
    // get filters and the call first tab data

    if(this._generalService.currentProject && this._generalService.currentProject.activeBoard) {

      this._taskStatusQuery.statuses$.pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.getFilterStatus(res);
        }
      });

    }

  }

  public getFilterStatus(statusList:TaskStatusModel[]) {
    // ready status filter dropdown data
    try {
      const columns = cloneDeep(this.currentProject.activeBoard.columns);

      if (columns) {

        const data = columns.reverse().find(column => !column.isHidden); // last column object find like 'Done/Complete' using 'isHidden'



        if (statusList && statusList.length > 0) {
          statusList.forEach((ele) => {
            let checked = true;
            if (data.headerStatus.id !== ele.id) {
              this.selectedColumnDataSource.push(ele.id);
            } else {
              checked = false;
            }
            this.statusColumnDataSource.push({
              label: ele.name,
              value: ele.id,
              checked: checked
            });
          });
        }

        if (this._generalService.currentProject) {
          this.filterStatusApplied(this.selectedColumnDataSource); // 'selectedColumnDataSource' have selected filter except 'Done/Complete'
        }
      }
      //status dropdown code
    }catch (e) {

    }
  }


  getAllTasks() {
    this.getTaskInProcess = true;
    this._taskService.getTaskWithFilter(this.allTaskFilterRequest).subscribe(result => {
      this.getTaskInProcess = false;

      if (result) {

        this.allTaskFilterRequest.page = result.data.page;
        this.allTaskFilterRequest.count = result.data.count;
        this.allTaskFilterRequest.totalItems = result.data.totalItems;
        this.allTaskFilterRequest.totalPages = result.data.totalPages;

        this.allTaskList = result.data.items;
      } else {
        this.allTaskList = [];
      }
    }, error => {
      this.getTaskInProcess = false;
      this.allTaskList = [];
    });
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


  public changeTab(tab?: string) {
    this.activeTab = tab;
    if(this.activeTab ==='my'){
      this.myTaskFilterRequest.page = 1;
      this.myTaskFilterRequest.queries= [];
      this.myTaskFilterRequest.queries.push({
        key: 'statusId', value: this.selectedColumnDataSource, condition: TaskFilterCondition.and
      });
      this.getMyTasks();
    } else {
      this.allTaskFilterRequest.page = 1;
      this.allTaskFilterRequest.queries= [];
      this.allTaskFilterRequest.queries.push({
        key: 'statusId', value: this.selectedColumnDataSource, condition: TaskFilterCondition.and
      });
      this.getAllTasks();
    }
  }


  // this function also calling from emitter from task list component
  public filterStatusApplied(query: string[]) {
    if(this.activeTab==='my') {
      if(query.length===this.statusColumnDataSource.length) {
        this.myTaskFilterRequest.page = 1;
      }
      this.myTaskFilterRequest.queries= [];
      this.myTaskFilterRequest.queries.push({
        key: 'statusId', value: query, condition: TaskFilterCondition.and
      });
      this.getMyTasks();
    }else {
      if(query.length===this.statusColumnDataSource.length) {
        this.allTaskFilterRequest.page = 1;
      }
      this.allTaskFilterRequest.queries= [];
      this.allTaskFilterRequest.queries.push({
        key: 'statusId', value: query, condition: TaskFilterCondition.and
      });
      this.getAllTasks();
    }
  }

  public searchMyTasks(term: string) {
    this.myTaskFilterRequest.query = term;
    this.myTaskFilterRequest.page = 1;
    this.myTaskFilterRequest.sort = 'name';
    this.myTaskFilterRequest.sortBy = 'asc';

    if(term){
      this.isFilterApplied = true;
    }

    this.getMyTasks();
  }

  public myTaskPageChanged(index: number) {
    this.myTaskFilterRequest.page = index;
    this.getMyTasks();
  }

  public myTaskSortingChanged(request: { type: string, columnName: string }) {
    this.myTaskFilterRequest.sort = request.columnName;
    this.myTaskFilterRequest.sortBy = request.type;

    this.getMyTasks();
  }

  public searchAllTasks(term: string) {
    this.allTaskFilterRequest.query = term;
    this.allTaskFilterRequest.page = 1;
    this.allTaskFilterRequest.sort = 'name';
    this.allTaskFilterRequest.sortBy = 'asc';

    if(term){
      this.isFilterApplied = true;
    }

    this.getAllTasks();
  }

  public allTaskPageChanged(index: number) {
    this.allTaskFilterRequest.page = index;

    this.getAllTasks();
  }

  public allTaskSortingChanged(request: { type: string, columnName: string }) {
    this.allTaskFilterRequest.sort = request.columnName;
    this.allTaskFilterRequest.sortBy = request.type;

    this.getAllTasks();
  }

  public changeView(view: string) {
    this.view = view;
  }

  public ngOnDestroy() {
  }
}
