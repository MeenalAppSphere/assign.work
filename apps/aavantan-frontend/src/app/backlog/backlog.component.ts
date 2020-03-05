import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import {
  SprintDurationsModel,
  AddTaskToSprintModel,
  DraftSprint,
  GetAllTaskRequestModel,
  GetUnpublishedRequestModel,
  RemoveTaskFromSprintModel,
  Sprint,
  SprintBaseRequest,
  SprintErrorEnum,
  SprintErrorResponse,
  Task,
  TaskFilterModel,
  TaskTypeModel,
  User
} from '@aavantan-app/models';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { GeneralService } from '../shared/services/general.service';
import { TaskService } from '../shared/services/task/task.service';
import { TaskQuery } from '../queries/task/task.query';
import { UserQuery } from '../queries/user/user.query';
import { cloneDeep, uniqBy } from 'lodash';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { SprintService } from '../shared/services/sprint/sprint.service';
import { Router } from '@angular/router';
import { TaskTypeQuery } from '../queries/task-type/task-type.query';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'aavantan-app-backlog',
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss']
})
export class BacklogComponent implements OnInit, OnDestroy {
  public backLogTasksList: Task[] = [];
  public backLogTasksListBackup: Task[] = [];
  public view: String = 'listView';
  public totalDuration: Number = 0;
  public durationData: any;
  public isDisabledCreateBtn: boolean = true;
  public draftSprint: DraftSprint;
  public draftTaskList: Task[] = [];
  public sprintModalIsVisible: boolean;
  public projectTeams: User[] = [];
  public unPublishedSprintData: Sprint;
  public teamCapacityModalIsVisible: boolean;

  public getTaskInProcess: boolean;
  public getAllActiveSprintTasksInProcess: boolean;

  public gettingUnpublishedInProcess: boolean;
  public createdSprintId: string = null;
  public publishSprintInProcess: boolean;
  public saveSprintInProcess: boolean;
  public activeSprintData: Sprint;
  public haveUnpublishedTasks: boolean;
  public taskTypeDataSource: TaskTypeModel[] = [];

  public searchValue: string;
  public searchValueSubject$: Subject<string> = new Subject<string>();
  public searchTaskListInProgress: boolean;

  public sprintId: string;
  public sprintDurations: SprintDurationsModel;

  public addTaskToSprintInProgress: boolean;
  public removeTaskFromSprintInProgress: boolean;
  public selectedTimeLogTask: Task;
  // public sortingRequest: TaskFilterModel = new TaskFilterModel('');
  public backLogTaskRequest: TaskFilterModel;

  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();

  public timelogModalIsVisible: boolean;


  constructor(private _generalService: GeneralService,
              private _taskService: TaskService,
              private _taskQuery: TaskQuery,
              private _taskTypeQuery: TaskTypeQuery,
              private _userQuery: UserQuery,
              private _sprintService: SprintService,
              protected notification: NzNotificationService,
              private modal: NzModalService,
              private router: Router) {

    this._taskTypeQuery.types$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.taskTypeDataSource = res;
      }
    });
  }

  ngOnInit() {

    this.searchValueSubject$.pipe(
      debounceTime(700),
      distinctUntilChanged()
    ).subscribe(val => {
      this.backLogTaskRequest.query = val;
      this.backLogTaskRequest.page = 1;
      this.backLogTaskRequest.sort = 'name';
      this.backLogTaskRequest.sortBy = 'asc';

      this.getAllBacklogTask();
    });

    if (this._generalService.currentProject && this._generalService.currentProject.id) {

      this.backLogTaskRequest = new TaskFilterModel(this._generalService.currentProject.id);

      // get all back log tasks
      this.getAllBacklogTask();

      // if project has active sprint than get all tasks of that sprint
      // if not get un-published sprint tasks

      if (this._generalService.currentProject.sprintId) {
        // get active sprint tasks
        this.activeSprintData = this._generalService.currentProject.sprint;
        this.sprintId = this.activeSprintData.id;

        this.setSprintDurations(this.activeSprintData);

        this.getAllSprintTasks();
      } else {
        // get unpublished sprint tasks
        this.getUnpublishedSprint();
      }
    }

    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.projectTeams = res.members;
      }
    });

    if (this.backLogTasksList && this.backLogTasksList.length > 0) {
      this.countTotalDuration();
    }

    // Sprint wizard data
    this.unPublishedSprintData = {
      name: null,
      projectId: this._generalService.currentProject.id,
      createdById: this._generalService.user.id,
      goal: null,
      startedAt: null,
      endAt: null,
      sprintStatus: null
    };
  }

  public async getAllBacklogTask() {

    this.getTaskInProcess = true;
    const result = await this._taskService.getAllBacklogTasks(this.backLogTaskRequest).toPromise();

    if (result.data) {
      this.backLogTaskRequest.page = result.data.page;
      this.backLogTaskRequest.count = result.data.count;
      this.backLogTaskRequest.totalPages = result.data.totalPages;
      this.backLogTaskRequest.totalItems = result.data.totalItems;

      this.backLogTasksList = cloneDeep(result.data.items);
      this.backLogTasksListBackup = cloneDeep(result.data.items);
    }

    this.getTaskInProcess = false;
  }

  public async getAllSprintTasks() {
    const json: GetAllTaskRequestModel = {
      projectId: this._generalService.currentProject.id,
      sort: 'createdAt',
      sortBy: 'desc',
      onlyBackLog: false,
      sprintId: this.activeSprintData.id
    };

    this.getAllActiveSprintTasksInProcess = true;

    const data = await this._taskService.getAllTask(json).toPromise();
    if (data.data && data.data.items.length > 0) {
      this.draftTaskList = data.data.items;
    }

    this.getAllActiveSprintTasksInProcess = false;
  }

  public async getUnpublishedSprint(hideLoader?: boolean) {
    if (hideLoader) {
      this.gettingUnpublishedInProcess = true;
    }

    try {
      const json: GetUnpublishedRequestModel = {
        projectId: this._generalService.currentProject.id
      };

      this._sprintService.getUnpublishedSprint(json).subscribe(data => {
        this.gettingUnpublishedInProcess = false;

        if ((typeof data.data) === 'string') {
          // no un-published sprint found
        } else {
          this.unPublishedSprintData = data.data;
          this.sprintId = this.unPublishedSprintData.id;

          const taskArray: Task[] = [];
          const ids: string[] = [];

          this.unPublishedSprintData.columns.forEach(column => {
            column.tasks.forEach((ele) => {
              ele.task.isSelected = true;
              taskArray.push(ele.task);
              ids.push(ele.task.id);
            });
          });

          this.draftSprint = {
            tasks: taskArray,
            ids: ids
          };
          this.draftTaskList = taskArray;
          if (this.draftTaskList.length > 0) {
            this.haveUnpublishedTasks = true;
            this.isDisabledCreateBtn = false;
          } else {
            this.haveUnpublishedTasks = false;
          }

          this.setSprintDurations(this.unPublishedSprintData);
        }

      });
    } catch (e) {
      this.gettingUnpublishedInProcess = false;
    }

  }

  public onChangeSearch(value: any): void {
    this.searchTaskListInProgress = true;

    this.searchTaskListInProgress = false;
  }

  public countTotalDuration() {
    this.backLogTasksList.forEach((ele) => {
      const duration = ele.estimatedTime ? ele.estimatedTime : 0;
      // @ts-ignore
      this.totalDuration += Number(duration);
      this.durationData = this._generalService.secondsToReadable(Number(this.totalDuration));
    });
  }

  public getTasksSelectedForSprint(ev: DraftSprint) {
    if (this.haveUnpublishedTasks) {
      let tasks = this.draftSprint.tasks.concat(ev.tasks);
      tasks = tasks.filter(task => task.isSelected);
      tasks = uniqBy(tasks, 'id');
      this.draftSprint.tasks = tasks;
    } else {
      if (!this.draftSprint) {
        this.draftSprint = {
          ids: [],
          tasks: []
        };
      }
      this.draftSprint.tasks = ev.tasks.filter(task => task.isSelected);
    }

    this.draftSprint.ids = this.draftSprint.tasks.map(task => task.id);
    this.isDisabledCreateBtn = !(this.draftSprint && this.draftSprint.tasks.length > 0);

    this.prepareDraftSprint();
    this.calculatedraftTaskListDuration();
  }

  public prepareDraftSprint() {
    this.draftTaskList = [...this.draftSprint.tasks];
  }

  public calculatedraftTaskListDuration() {
    let estimatedTime = 0;
    this.draftTaskList.forEach((ele) => {
      estimatedTime = estimatedTime + Number(ele.estimatedTime);
    });

    this.unPublishedSprintData.totalEstimation = estimatedTime;
    this.unPublishedSprintData.totalEstimationReadable = this._generalService.secondsToReadable(this.unPublishedSprintData.totalEstimation).readable;
    this.unPublishedSprintData.totalRemainingCapacity = (this.unPublishedSprintData.totalCapacity * 3600) - estimatedTime;
    this.unPublishedSprintData.totalRemainingCapacityReadable = this._generalService.secondsToReadable(this.unPublishedSprintData.totalRemainingCapacity).readable;
  }

  public toggleAddSprint(data?: Sprint) {
    if (data) {
      this.unPublishedSprintData = data;
      this.sprintId = data.id;
    }
    this.sprintModalIsVisible = !this.sprintModalIsVisible;
  }

  public async publishSprint() {
    try {
      const sprintData: SprintBaseRequest = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.unPublishedSprintData.id
      };

      this.publishSprintInProcess = true;
      const data = await this._sprintService.publishSprint(sprintData).toPromise();
      if (data) {
        this.isDisabledCreateBtn = true;
        this.router.navigate(['dashboard', 'board']);
      }
      this.publishSprintInProcess = false;
    } catch (e) {
      this.createdSprintId = null;
      this.publishSprintInProcess = false;
    }
  }

  public toggleTeamCapacity(data?: SprintDurationsModel) {
    if (data) {
      this.sprintDurations = data;
    }
    this.teamCapacityModalIsVisible = !this.teamCapacityModalIsVisible;
  }

  public addTaskNavigate() {
    let displayName: string = null;
    if (this.taskTypeDataSource[0] && this.taskTypeDataSource[0].displayName) {
      displayName = this.taskTypeDataSource[0].displayName;
    }

    if (!displayName) {
      this.notification.error('Info', 'Please create Task Types, Status, Priority from settings');
      setTimeout(() => {
        this.router.navigateByUrl('dashboard/settings');
      }, 1000);
      return;
    }
    this.router.navigateByUrl('dashboard/task/' + displayName);
  }

  public async addTaskToSprint(task: Task, isAdd: boolean, adjustHoursAllowed?: boolean) {
    try {
      if (!isAdd) {
        return;
      }

      const json: AddTaskToSprintModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.sprintId,
        taskId: task.id,
        adjustHoursAllowed: adjustHoursAllowed
      };

      this.addTaskToSprintInProgress = true;

      const data = await this._sprintService.addTaskToSprint(json).toPromise();

      if (data.data) {
        // check if we found error while adding task

        if (data.data.hasOwnProperty('tasksError') || data.data.hasOwnProperty('membersError')) {
          const errorResponse = data.data as SprintErrorResponse;

          // check if error is related to tasks error or members error
          if (errorResponse.tasksError) {
            // if sprint capacity is exceeding show confirm box to allow to exceed sprint capacity
            if (errorResponse.tasksError.reason === SprintErrorEnum.sprintCapacityExceed) {

              // uncheck item code here

              this.addTaskToSprintInProgress = false;
              await this.addTaskConfirmAfterError(task);
              return;
            } else {
              // show error toaster
              this.notification.error('Error', errorResponse.tasksError.reason);
            }
          } else {
            // if member capacity is exceeding show confirm box to allow to exceed sprint capacity
            if (errorResponse.membersError.reason === SprintErrorEnum.sprintCapacityExceed) {

              // uncheck item code here

              this.addTaskToSprintInProgress = false;
              await this.addTaskConfirmAfterError(task);
              return;
            } else {
              // show error toaster
              this.notification.error('Error', errorResponse.tasksError.reason);
            }
          }
        } else {
          this.sprintDurations = data.data as SprintDurationsModel;
          this.notification.success('Success', 'Task successfully added to this Sprint');
        }
      }

      this.draftTaskList = [...this.draftTaskList, task];
      this.backLogTasksList = this.backLogTasksList.filter(backLog => backLog.id !== task.id);

      this.addTaskToSprintInProgress = false;
    } catch (e) {
      console.log(e);
      this.addTaskToSprintInProgress = false;
    }
  }

  public async removeTaskFromSprint(task: Task) {
    try {
      const json: RemoveTaskFromSprintModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.sprintId,
        taskId: task.id
      };
      this.removeTaskFromSprintInProgress = true;
      const result = await this._sprintService.removeTaskFromSprint(json).toPromise();

      if (result && result.data) {
        this.draftTaskList = this.draftTaskList.filter(draftTask => draftTask.id !== task.id);
        this.backLogTasksList = [...this.backLogTasksList, task];
        this.sprintDurations = result.data;
      }

      this.removeTaskFromSprintInProgress = false;
    } catch (e) {
      console.log(e);
      this.removeTaskFromSprintInProgress = false;
    }
  }

  async addTaskConfirmAfterError(task: Task) {
    return this.modal.confirm({
      nzTitle: 'Still Want to add task?',
      nzContent: 'May be this will effect your current Sprint',
      nzOnOk: () =>
        new Promise((resolve, reject) => {
          this.addTaskToSprint(task, true, true);
          setTimeout(Math.random() > 0.5 ? resolve : reject, 10);
          return true;
        }).catch(() => console.log('Oops errors!'))
    });

  }

  public pageChanged(index: number, requestType: string) {
    if (requestType === 'backlog') {
      this.backLogTaskRequest.page = index;
      this.getAllBacklogTask();
    }
  }

  public sortButtonClicked(type: string, columnName: string, requestType: string) {
    if (requestType === 'backlog') {
      this.backLogTaskRequest.sort = columnName;
      this.backLogTaskRequest.sortBy = type;

      this.getAllBacklogTask();
    } else if (requestType === 'un-published-sprint') {

    } else {

    }
  }

  public viewTask(task: Task) {
    this.router.navigateByUrl('dashboard/task/' + task.displayName);
  }

  /** time log **/
  public timeLog(item: Task) {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
    this.selectedTimeLogTask = item;
  }

  private setSprintDurations(sprint: Sprint) {
    this.sprintDurations = {
      totalCapacity: sprint.totalCapacity,
      totalCapacityReadable: sprint.totalCapacityReadable,
      totalRemainingCapacity: sprint.totalRemainingCapacity,
      totalRemainingCapacityReadable: sprint.totalRemainingCapacityReadable,
      totalEstimation: sprint.totalEstimation,
      totalEstimationReadable: sprint.totalEstimationReadable
    };
  }

  public ngOnDestroy() {

  }

}
