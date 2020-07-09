import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, TemplateRef } from '@angular/core';
import {
  AppFilterStorageKeysEnum,
  BaseResponseModel,
  MoveTaskToColumnModel, NotificationTypeEnum,
  Project,
  ProjectStatus,
  RemoveTaskFromSprintModel,
  Sprint,
  SprintColumn,
  SprintColumnTask,
  SprintFilterTasksModel,
  SprintTaskTimeLogResponse,
  Task,
  TaskTypeModel,
  User
} from '@aavantan-app/models';
import { GeneralService } from '../../shared/services/general.service';
import { SprintService } from '../../shared/services/sprint/sprint.service';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserQuery } from '../../queries/user/user.query';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { TaskTypeQuery } from '../../queries/task-type/task-type.query';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'aavantan-app-board',
  templateUrl: './running-sprint.component.html',
  styleUrls: ['./running-sprint.component.scss']
})
export class RunningSprintComponent implements OnInit, OnDestroy {
  @ViewChild('boardUpdatedNotificationTemplate', { static: false }) boardUpdatedNotificationTemplate: TemplateRef<{}>;

  public boardData: Sprint;
  public boardDataClone: Sprint;

  public searchValue: string;
  public searchValueSubject$: Subject<string> = new Subject<string>();

  public timelogModalIsVisible: boolean;
  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  public selectedTask = {
    columnIndex: null, taskIndex: null, taskItem: null
  };
  public getRunningSprintInProcess: boolean;
  public closeSprintInProcess: boolean = false;

  public taskTypeDataSource: TaskTypeModel[] = [];
  // close sprint modal
  public selectedSprintStatus: ProjectStatus;
  public isVisibleCloseSprint: boolean;
  public closeSprintModeSelection = 'createNewSprint';
  public dateFormat = 'MM/dd/yyyy';
  public closeSprintNewSprintForm: FormGroup;
  public filterSprintTasksRequest: SprintFilterTasksModel;
  public isFilterApplied: boolean = false;

  public currentProject: Project;

  public moveFromColumn: SprintColumn;

  constructor(private _generalService: GeneralService,
              private _sprintService: SprintService,
              private _taskTypeQuery: TaskTypeQuery,
              protected notification: NzNotificationService,
              private _userQuery: UserQuery, private router: Router,
              private modal: NzModalService, private socket: Socket) {

    this._taskTypeQuery.types$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.taskTypeDataSource = res;
      }
    });

  }

  ngOnInit() {

    this._userQuery.currentProject$
      .pipe(untilDestroyed(this))
      .subscribe(project => {
        this.currentProject = project;
      });

    // search sprint tasks event
    this.searchValueSubject$.pipe(
      debounceTime(700),
      distinctUntilChanged(),
      untilDestroyed(this)
    ).subscribe(val => {
      this.filterSprintTasksRequest.query = val;
      this.getBoardData();
    });

    if (this.currentProject && this.currentProject.sprintId && this.currentProject.id) {

      this.filterSprintTasksRequest = new SprintFilterTasksModel(this.currentProject.id, this.currentProject.sprintId);

      // get sprint filter from local storage
      let availableFilter: any = this._generalService.getAppFilter(this.currentProject.id, AppFilterStorageKeysEnum.sprintBoardFilter);

      if (availableFilter) {
        availableFilter = availableFilter as SprintFilterTasksModel;
        this.filterSprintTasksRequest.assigneeIds = availableFilter.assigneeIds;
        this.filterSprintTasksRequest.query = availableFilter.query;
        this.searchValue = availableFilter.query || '';

        this.isFilterApplied = !!(availableFilter.assigneeIds.length);
      }

      this.getBoardData();
    } else {
      this.notification.info('Info', 'Sprint not found');
    }

    this.closeSprintNewSprintForm = new FormGroup({
      projectId: new FormControl(this.currentProject.id, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      goal: new FormControl(null, [Validators.required]),
      duration: new FormControl(null, [Validators.required]),
      startedAt: new FormControl(null, []),
      endAt: new FormControl(null, []),
      createAndPublishNewSprint: new FormControl(true)
    });

    // board updated
    this.socket.on(NotificationTypeEnum.boardUpdated, () => {
      this.notification.template(this.boardUpdatedNotificationTemplate)
    });

  }

  public filterTask(user: User) {
    const inFilter = this.filterSprintTasksRequest.assigneeIds.includes(user.id);
    if (!inFilter) {
      this.filterSprintTasksRequest.assigneeIds.push(user.id);
    } else {
      this.filterSprintTasksRequest.assigneeIds = this.filterSprintTasksRequest.assigneeIds.filter(assignee => {
        return assignee !== user.id;
      });
    }

    this.getBoardData();
  }

  /**
   * show all items
   * resets all filter and shows all items
   */
  public showAllItems() {
    this.isFilterApplied = false;
    this.filterSprintTasksRequest = new SprintFilterTasksModel(this.currentProject.id, this.currentProject.sprintId);

    this.filterSprintTasksRequest.query = this.searchValue;
    this.getBoardData();
  }

  async getBoardData() {
    this.notification.remove();
    this.isFilterApplied = !!(this.filterSprintTasksRequest.assigneeIds.length);
    try {
      // set filter to storage
      this._generalService.setAppFilter(this.currentProject.id, { sprintBoardFilter: this.filterSprintTasksRequest });

      this.getRunningSprintInProcess = true;

      const data = await this._sprintService.filterSprintTasks(this.filterSprintTasksRequest).toPromise();
      this.prepareBoardData(data);
      this.getRunningSprintInProcess = false;
    } catch (e) {
      this.getRunningSprintInProcess = false;
    }
  }

  private prepareBoardData(data: BaseResponseModel<Sprint>) {
    if (data.data) {
      data.data.membersCapacity.forEach(member => {
        member.user.isSelected = this.filterSprintTasksRequest.assigneeIds.includes(member.userId.toString());
      });
      data.data.columns.forEach((column) => {
        column.tasks.forEach((task) => {
          if (!task.task.priority) {
            task.task.priority = {
              name: null,
              color: '#6E829C',
              projectId: ''
            };
          }
          if (!task.task.taskType) {
            task.task.taskType = {
              name: null,
              color: '#6E829C'
            };
          }
        });
      });
      this.boardData = data.data;
      this.boardDataClone = cloneDeep(data.data);
    }
  }

  public async moveTask(task: SprintColumnTask, column: SprintColumn, dropIndex: number) {
    try {

      const json: MoveTaskToColumnModel = {
        projectId: this.currentProject.id,
        sprintId: this.boardData.id,
        columnId: column.id,
        taskId: task.taskId,
        dropIndex
      };

      this.getRunningSprintInProcess = true;
      await this._sprintService.moveTaskToColumn(json).toPromise();
      this.moveFromColumn = null;

      this.getBoardData();
    } catch (e) {
      this.getRunningSprintInProcess = false;
    }
  }

  onDragStart(item: SprintColumn) {
    this.moveFromColumn = item;
  }

  async onDragEnd($event, item: SprintColumn) {
    this.moveTask($event.data, item, $event.index);
  }

  //============ close sprint =============//
  // public toggleCloseSprintShow(item?:Sprint){
  //   this.closeSprintModalIsVisible = !this.closeSprintModalIsVisible;
  //   if(item){
  //     this.activeSprintData=item;
  //   }
  // }

  public selectStatus(item: ProjectStatus) {
    this.selectedSprintStatus = item;
  }

  toggleCloseSprintShow(): void {
    this.isVisibleCloseSprint = !this.isVisibleCloseSprint;
  }

  cancelCloseSprintDialog(): void {
    this.isVisibleCloseSprint = false;
  }

  //---------------------------------------//

  public viewTask(task: Task) {
    this.router.navigateByUrl('dashboard/task/' + task.displayName);
  }

  public showTimeLogModal(columnIndex: number, taskIndex: number, taskItem: Task) {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
    this.selectedTask = {
      columnIndex, taskIndex, taskItem
    };
  }

  public hideTimeLogModal(resp?: SprintTaskTimeLogResponse) {
    if (resp) {
      this.boardData.progress = resp.progress;
      this.boardData.overProgress = resp.overProgress;
      this.boardData.columns[this.selectedTask.columnIndex].tasks[this.selectedTask.taskIndex].totalLoggedTime = resp.taskTotalLoggedTime;
      this.boardData.columns[this.selectedTask.columnIndex].tasks[this.selectedTask.taskIndex].totalLoggedTimeReadable = resp.taskTotalLoggedTimeReadable;

    }
    this.timelogModalIsVisible = false;
    this.selectedTask = {
      columnIndex: null, taskIndex: null, taskItem: null
    };
  }

  public async removeTaskToSprint(taskId: string) {
    try {

      return this.modal.confirm({
        nzTitle: 'Want to remove task from sprint?',
        nzContent: '',
        nzOnOk: () =>
          new Promise(async (resolve, reject) => {
            const json: RemoveTaskFromSprintModel = {
              projectId: this.currentProject.id,
              sprintId: this.boardData.id,
              taskId: taskId
            };
            await this._sprintService.removeTaskFromSprint(json).toPromise();
            setTimeout(Math.random() > 0.5 ? resolve : reject, 10);
            this.getBoardData();
            return true;
          }).catch(() => console.log('Oops errors!'))
      });

    } catch (e) {
      console.log(e);
      this.getRunningSprintInProcess = false;
    }
  }

  ngOnDestroy() {

  }

}
