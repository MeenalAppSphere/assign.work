import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import {
  AddTaskToSprintModel,
  AssignTasksToSprintModel,
  DraftSprint,
  GetAllTaskRequestModel,
  GetUnpublishedRequestModel, RemoveTaskFromSprintModel,
  Sprint,
  SprintBaseRequest,
  SprintErrorResponse,
  Task, TaskFilterDto,
  TaskTypeModel,
  User
} from '@aavantan-app/models';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { GeneralService } from '../shared/services/general.service';
import { TaskService } from '../shared/services/task/task.service';
import { TaskQuery } from '../queries/task/task.query';
import { UserQuery } from '../queries/user/user.query';
import { cloneDeep, uniqBy } from 'lodash';
import { NzNotificationService } from 'ng-zorro-antd';
import { SprintService } from '../shared/services/sprint/sprint.service';
import { Router } from '@angular/router';
import { TaskTypeQuery } from '../queries/task-type/task-type.query';

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
  public searchTaskListInProgress: boolean;


  public tasksSelected: DraftSprint = {
    sprintId: null,
    ids: [],
    tasks: [],
    duration: 0
  };

  public addTaskToSprintInProgress: boolean;
  public removeTaskFromSprintInProgress: boolean;
  public selectedTimeLogTask: Task;
  public sortingRequest: TaskFilterDto = {
    sort: '', sortBy: ''
  };

  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  public timelogModalIsVisible: boolean;


  constructor(private _generalService: GeneralService,
              private _taskService: TaskService,
              private _taskQuery: TaskQuery,
              private _taskTypeQuery: TaskTypeQuery,
              private _userQuery: UserQuery,
              private _sprintService: SprintService,
              protected notification: NzNotificationService,
              private router: Router) {

    this._taskTypeQuery.types$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.taskTypeDataSource = res;
      }
    });
  }

  ngOnInit() {
    if (this._generalService.currentProject && this._generalService.currentProject.id) {
      // get all back log tasks
      this.getAllBacklogTask();

      // if project has active sprint than get all tasks of that sprint
      // if not get un-published sprint tasks

      if (this._generalService.currentProject.sprintId) {
        // get active sprint tasks
        this.activeSprintData = this._generalService.currentProject.sprint;
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
    const json: GetAllTaskRequestModel = {
      projectId: this._generalService.currentProject.id,
      sort: 'createdAt',
      sortBy: 'desc',
      onlyBackLog: true
    };

    this.getTaskInProcess = true;
    const data = await this._taskService.getAllBacklogTasks(json).toPromise();
    if (data.data && data.data.items.length > 0) {
      this.backLogTasksList = cloneDeep(data.data.items);
      this.backLogTasksListBackup = cloneDeep(data.data.items);
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

        } else {
          this.unPublishedSprintData = data.data;

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
        }

      });
    } catch (e) {
      this.gettingUnpublishedInProcess = false;
    }

  }

  public onChangeSearch(value: any): void {
    this.searchTaskListInProgress = true;
    this.backLogTasksList = this.backLogTasksListBackup;
    if (value) {
      this.backLogTasksList = this.backLogTasksList.filter((ele) => {
        let taskTypeName = '';
        let profileName = '';
        if (ele.taskType && ele.taskType.name) {
          taskTypeName = ele.taskType.name.toLowerCase();
        }
        if (ele.assignee && ele.assignee.firstName || ele.assignee && ele.assignee.lastName) {
          profileName = (ele.assignee.firstName + ' ' + ele.assignee.lastName).toLowerCase();
        }
        if (ele.name.toLowerCase().includes(value) || taskTypeName.includes(value) || profileName.includes(value)) {
          return ele;
        }
      });
    } else {
      this.backLogTasksList = this.backLogTasksListBackup;
    }
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

  public toggleTeamCapacity(data?: Sprint) {
    if (data) {
      this.unPublishedSprintData = data;
    }
    this.teamCapacityModalIsVisible = !this.teamCapacityModalIsVisible;
  }

  public addTaskNavigate() {
    let displayName: string = null;
    if (this.taskTypeDataSource[0] && this.taskTypeDataSource[0].displayName) {
      displayName = this.taskTypeDataSource[0].displayName;
    }

    if (!displayName) {
      this.notification.error('Info', 'Please create Stages, Task Types, Status, Priority from settings');
      setTimeout(() => {
        this.router.navigateByUrl('dashboard/settings');
      }, 1000);
      return;
    }
    this.router.navigateByUrl('dashboard/task/' + displayName);
  }


  public async addTaskToSprint(task: Task, isAdd: boolean) {

    try {
      if (!isAdd) {
        return;
      }

      const json: AddTaskToSprintModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.tasksSelected.sprintId || this.activeSprintData.id,
        adjustHoursAllowed: false,
        taskId: task.id
      };
      this.addTaskToSprintInProgress = true;

      await this._sprintService.addTaskToSprint(json).toPromise();

      task.isSelected = isAdd;
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
        sprintId: this.tasksSelected.sprintId || this.activeSprintData.id,
        taskId: task.id
      };
      this.removeTaskFromSprintInProgress = true;
      await this._sprintService.removeTaskFromSprint(json).toPromise();

      task.isSelected = false;
      this.draftTaskList = this.draftTaskList.filter(draftTask => draftTask.id !== task.id);
      this.backLogTasksList = [...this.backLogTasksList, task];

      this.removeTaskFromSprintInProgress = false;
    } catch (e) {
      console.log(e);
      this.removeTaskFromSprintInProgress = false;
    }
  }

  public sortButtonClicked(type: 'asc' | 'desc', columnName: string) {
    this.sortingRequest.sort = type;
    this.sortingRequest.sortBy = columnName;
    const json: GetAllTaskRequestModel = {
      projectId: this._generalService.currentProject.id,
      sort: columnName,
      sortBy: type
    };
    this._taskService.getAllTask(json).subscribe();
    console.log('Sorting Request: ', this.sortingRequest);
  }

  public viewTask(task: Task) {
    this.router.navigateByUrl('dashboard/task/' + task.displayName);
  }


  /** time log **/
  public timeLog(item: Task) {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
    this.selectedTimeLogTask = item;
  }

  public ngOnDestroy() {

  }

}
