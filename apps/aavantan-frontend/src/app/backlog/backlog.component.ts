import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  AddTaskToSprintModel,
  CloseSprintModel,
  DraftSprint,
  GetUnpublishedRequestModel, Project,
  RemoveTaskFromSprintModel,
  Sprint,
  SprintBaseRequest,
  SprintDurationsModel,
  SprintErrorEnum,
  SprintErrorResponse,
  SprintTaskFilterModel, StatusDDLModel,
  Task,
  TaskFilterCondition,
  TaskFilterModel, TaskStatusModel,
  TaskTypeModel,
  User, UserRoleModel
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
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TaskStatusQuery } from '../queries/task-status/task-status.query';
import { FormControl, FormGroup, Validators } from '@angular/forms';

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

  public getBacklogTasksInProcess: boolean;
  public getAllActiveSprintTasksInProcess: boolean;
  public addTaskToSprintInProgress: boolean;
  public removeTaskFromSprintInProgress: boolean;

  public backLogTableLoadingTip: string = 'Loading';
  public sprintTableLoadingTip: string = 'Loading';

  public gettingUnpublishedInProcess: boolean;
  public createdSprintId: string = null;
  public publishSprintInProcess: boolean;
  public saveSprintInProcess: boolean;
  public activeSprintData: Sprint;
  public haveUnpublishedTasks: boolean;
  public taskTypeDataSource: TaskTypeModel[] = [];

  public searchValue: string;
  public searchValueSubject$: Subject<string> = new Subject<string>();

  public sprintId: string;
  public sprintDurations: SprintDurationsModel;

  public selectedTimeLogTask: Task;

  public backLogTaskRequest: TaskFilterModel;
  public backLogStatusQueryRequest: Array<{ name: string, value: string, isSelected: boolean }> = [];
  public allStatusesChecked: boolean = true;
  public allStatusesIndeterminate = true;

  public sprintTasksRequest: SprintTaskFilterModel;

  public totalItemsInSprint: Number;

  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();

  public timelogModalIsVisible: boolean;
  public isVisibleCloseSprint: boolean;
  public closeSprintInProcess: boolean;
  public closeSprintModeSelection = 'createNewSprint';
  public dateFormat = 'MM/dd/yyyy';
  public closeSprintNewSprintForm: FormGroup;

  // status ddl
  public statusColumnDataSource: StatusDDLModel[] = [];
  public selectedColumnDataSource: string[] = [];

  public currentProject: Project;

  // for permission
  public currentUserRole:UserRoleModel;

  constructor(private _generalService: GeneralService,
              private _taskService: TaskService,
              private _taskQuery: TaskQuery,
              private _taskTypeQuery: TaskTypeQuery,
              private _taskStatusQuery: TaskStatusQuery,
              private _userQuery: UserQuery,
              private _sprintService: SprintService,
              protected notification: NzNotificationService,
              private modal: NzModalService,
              private router: Router,
              private _cdr: ChangeDetectorRef) {
  }

  ngOnInit() {

    // subscribe for all task types
    this._taskTypeQuery.types$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.taskTypeDataSource = res;
      }
    });

    // subscribe for al task statuses
    this._taskStatusQuery.statuses$.pipe(untilDestroyed(this)).subscribe(statuses => {
      const backLogStatusQueryRequest = [];
      if (statuses) {
        statuses.forEach(status => {
          backLogStatusQueryRequest.push({ name: status.name, value: status.id, isSelectd: false });
        });
      }

      this.backLogStatusQueryRequest = backLogStatusQueryRequest;
    });


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

      // get current project from store
      this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.currentProject = res;
        }
      });
      // get filters and the call first tab data

      // create status dropdown
      this._taskStatusQuery.statuses$.pipe(untilDestroyed(this)).subscribe(res => {
        if(res) {
          this.getFilterStatus(res);
        }
      });

      // get all back log tasks
      this.getAllBacklogTask();

      // if project has active sprint than get all tasks of that sprint
      // if not get un-published sprint tasks

      if (this._generalService.currentProject.sprintId) {

        this.sprintTasksRequest = new SprintTaskFilterModel(this._generalService.currentProject.id, this._generalService.currentProject.sprintId);

        // get active sprint tasks
        this.activeSprintData = this._generalService.currentProject.sprint;
        this.sprintId = this.activeSprintData.id;

        this.setSprintDurations(this.activeSprintData);

      } else {
        // get unpublished sprint data
        this.getUnpublishedSprint();

        // get unpublished sprint tasks
        this.sprintTasksRequest = new SprintTaskFilterModel(this._generalService.currentProject.id, null);
      }

      this.getAllSprintTasks();
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

    // get current user role from store
    this._userQuery.userRole$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentUserRole = res;
      }
    });

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

    this.closeSprintNewSprintForm = new FormGroup({
      projectId: new FormControl(this._generalService.currentProject.id, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      goal: new FormControl(null, [Validators.required]),
      duration: new FormControl(null, [Validators.required]),
      startedAt: new FormControl(null, []),
      endAt: new FormControl(null, []),
      createAndPublishNewSprint: new FormControl(true)
    });
  }


  public getFilterStatus(statusList:TaskStatusModel[]) {
    // ready status filter dropdown data
    const columns = cloneDeep(this.currentProject.activeBoard.columns);

    if (columns) {
      const data = columns.reverse().find(column => !column.isHidden); // last column object find like 'Done/Complete' using 'isHidden'

      if(statusList && statusList.length>0) {
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

        this.backLogTaskRequest.queries = [];
        this.backLogTaskRequest.queries.push({
          key: 'statusId', value: this.selectedColumnDataSource, condition: TaskFilterCondition.and
        });
      }

    }

  }

  public async getAllBacklogTask() {
    this.backLogTableLoadingTip = 'Getting Backlog Tasks...';
    this.getBacklogTasksInProcess = true;
    try {
      const result = await this._taskService.getAllBacklogTasks(this.backLogTaskRequest).toPromise();

      if (result.data) {
        this.backLogTaskRequest.page = result.data.page;
        this.backLogTaskRequest.count = result.data.count;
        this.backLogTaskRequest.totalPages = result.data.totalPages;
        this.backLogTaskRequest.totalItems = result.data.totalItems;

        this.backLogTasksList = cloneDeep(result.data.items);
        this.backLogTasksListBackup = cloneDeep(result.data.items);
      }

      this.getBacklogTasksInProcess = false;
    } catch (e) {
      this.getBacklogTasksInProcess = false;
    }
  }

  public async getAllSprintTasks() {
    this.sprintTableLoadingTip = 'Getting Sprint Tasks..';
    try {
      this.getAllActiveSprintTasksInProcess = true;

      let data;
      if (this.sprintTasksRequest.sprintId) {
        data = await this._taskService.getAllSprintTasks(this.sprintTasksRequest).toPromise();
      } else {
        data = await this._taskService.getAllUnfinishedSprintTasks(this.sprintTasksRequest).toPromise();
      }

      if (data.data) {
        this.draftTaskList = data.data.items;
        this.sprintTasksRequest.page = data.data.page;
        this.sprintTasksRequest.count = data.data.count;
        this.sprintTasksRequest.totalPages = data.data.totalPages;
        this.sprintTasksRequest.totalItems = data.data.totalItems;

        this.totalItemsInSprint = data.data.totalItems;
      } else {
        this.totalItemsInSprint = 0;
      }

      this.getAllActiveSprintTasksInProcess = false;
    } catch (e) {
      this.getAllActiveSprintTasksInProcess = false;
    }
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
      this.draftTaskList = this.draftTaskList ? this.draftTaskList : [];
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

      this.backLogTableLoadingTip = 'Adding Task to Sprint...';
      this.sprintTableLoadingTip = 'Adding Task to Sprint...';
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
      this.sprintTasksRequest.totalItems++;

      this.backLogTasksList = this.backLogTasksList.filter(backLog => backLog.id !== task.id);
      this.backLogTaskRequest.totalItems--;

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

      this.backLogTableLoadingTip = 'Removing Task from Sprint...';
      this.sprintTableLoadingTip = 'Removing Task from Sprint...';

      this.removeTaskFromSprintInProgress = true;
      const result = await this._sprintService.removeTaskFromSprint(json).toPromise();

      if (result && result.data) {
        this.draftTaskList = this.draftTaskList.filter(draftTask => draftTask.id !== task.id);
        this.sprintTasksRequest.totalItems--;

        this.backLogTasksList = [...this.backLogTasksList, task];
        this.backLogTaskRequest.totalItems++;

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

    } else if (requestType === 'activeSprint') {

      this.sprintTasksRequest.page = index;
      this.getAllSprintTasks();
    }
  }

  public sortButtonClicked(type: string, columnName: string, requestType: string) {
    if (requestType === 'backlog') {
      this.backLogTaskRequest.sort = columnName;
      this.backLogTaskRequest.sortBy = type;

      this.getAllBacklogTask();
    } else if (requestType === 'activeSprint') {

      this.sprintTasksRequest.sort = columnName;
      this.sprintTasksRequest.sortBy = type;
      this.getAllSprintTasks();
    }
  }

  public viewTask(task: Task) {
    this.router.navigateByUrl('dashboard/task/' + task.displayName);
  }

  public selectAllStatuses() {
    this.allStatusesIndeterminate = false;
    this.backLogStatusQueryRequest = this.backLogStatusQueryRequest.map(status => {
      status.isSelected = this.allStatusesChecked;
      return status;
    });

    this.backLogStatusChanged();
  }

  public selectSingleStatus(): void {
    this.allStatusesChecked = this.backLogStatusQueryRequest.every(status => status.isSelected);
    this.allStatusesIndeterminate = !this.allStatusesChecked;

    this.backLogStatusChanged();
  }

  public backLogStatusChanged() {
    this.backLogTaskRequest.page = 1;
    this.backLogTaskRequest.sort = 'name';
    this.backLogTaskRequest.sortBy = 'asc';
    this.backLogTaskRequest.queries = [];

    const isAnyStatusSelected = this.backLogStatusQueryRequest.some(status => status.isSelected);
    if (isAnyStatusSelected) {
      this.backLogTaskRequest.queries.push({
        key: 'status', condition: TaskFilterCondition.or,
        value: this.backLogStatusQueryRequest.filter(status => status.isSelected).map(status => status.value)
      });
    }

    this.getAllBacklogTask();
  }


  /** filter status **/
  public showAll() {
    this.statusColumnDataSource.forEach((ele)=>{
      this.selectedColumnDataSource.push(ele.value);
    });
    this._cdr.detectChanges();
    this.backLogTaskRequest.queries= [];
    this.backLogTaskRequest.queries.push({
      key: 'statusId', value: this.selectedColumnDataSource, condition: TaskFilterCondition.and
    });
    this.getAllBacklogTask();
  }

  public updateSingleChecked(item:any) {
    this.backLogTaskRequest.queries= [];
    this.backLogTaskRequest.queries.push({
      key: 'statusId', value: item, condition: TaskFilterCondition.and
    });
    this.getAllBacklogTask();
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

  /** close sprint **/

  toggleCloseSprintShow(): void {
    this.isVisibleCloseSprint = true;
  }

  async closeSprint() {
    this.closeSprintInProcess = true;

    const closeSprintRequest = new CloseSprintModel();
    closeSprintRequest.projectId = this._generalService.currentProject.id;
    closeSprintRequest.sprintId = this.sprintId;

    if (this.closeSprintModeSelection === 'createNewSprint') {
      closeSprintRequest.createNewSprint = true;

      const sprintForm = this.closeSprintNewSprintForm.getRawValue();
      if (sprintForm.duration) {
        sprintForm.startedAt = sprintForm.duration[0];
        sprintForm.endAt = sprintForm.duration[1];
        delete sprintForm.duration;
      }

      closeSprintRequest.sprint = sprintForm;
      closeSprintRequest.createAndPublishNewSprint = sprintForm.createAndPublishNewSprint;
    } else {
      closeSprintRequest.createNewSprint = false;
    }

    try {
      await this._sprintService.closeSprint(closeSprintRequest).toPromise();
      this.closeSprintInProcess = false;

      this.isVisibleCloseSprint = false;
      this.router.navigate(['dashboard']);
    } catch (e) {
      this.closeSprintInProcess = false;
      console.log(e);
    }
  }

  cancelCloseSprintDialog(): void {
    this.isVisibleCloseSprint = false;
  }

  public ngOnDestroy() {

  }

}
