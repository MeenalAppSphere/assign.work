import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import {
  BaseResponseModel,
  CloseSprintModel,
  GetAllTaskRequestModel,
  MoveTaskToColumnModel,
  ProjectStatus,
  Sprint,
  SprintColumn,
  SprintColumnTask,
  Task,
  TaskTypeModel,
  User,
  TaskTimeLogResponse,
  SprintFilterTasksModel,
  AddTaskToSprintModel,
  SprintErrorResponse,
  SprintErrorEnum,
  RemoveTaskFromSprintModel
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

@Component({
  selector: 'aavantan-app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnDestroy {

  public boardData: Sprint;
  public boardDataClone: Sprint;

  public searchValue: string;
  public searchValueSubject$: Subject<string> = new Subject<string>();

  public timelogModalIsVisible: boolean;
  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  public selectedTask = {
    columnIndex: null, taskIndex: null, taskItem: null
  };
  public getStageInProcess: boolean;
  public closeSprintInProcess: boolean = false;

  public taskTypeDataSource: TaskTypeModel[] = [];
  // close sprint modal
  public selectedSprintStatus: ProjectStatus;
  public statusSprintDataSource: ProjectStatus[] = [];
  public closeSprintModalIsVisible: boolean;
  public isVisibleCloseSprint: boolean;
  public closeSprintModeSelection = 'createNewSprint';
  public dateFormat = 'MM/dd/yyyy';
  public closeSprintNewSprintForm: FormGroup;
  public filterSprintTasksRequest: SprintFilterTasksModel;

  public moveFromStage: SprintColumn;

  constructor(private _generalService: GeneralService,
              private _sprintService: SprintService,
              private _taskTypeQuery: TaskTypeQuery,
              protected notification: NzNotificationService,
              private modalService: NzModalService,
              private _userQuery: UserQuery, private router: Router,
              private modal: NzModalService) {

    this._taskTypeQuery.types$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.taskTypeDataSource = res;
      }
    });

  }

  ngOnInit() {

    // search sprint tasks event
    this.searchValueSubject$.pipe(
      debounceTime(700),
      distinctUntilChanged()
    ).subscribe(val => {
      this.filterSprintTasksRequest.query = val;
      this.getBoardData();
    });

    if (this._generalService.currentProject.sprintId && this._generalService.currentProject.id) {

      this.filterSprintTasksRequest = new SprintFilterTasksModel(this._generalService.currentProject.id, this._generalService.currentProject.sprintId);

      this.getBoardData();
    } else {
      this.notification.info('Info', 'Sprint not found');
    }

    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.statusSprintDataSource = res.settings.statuses;
      }
    });

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

  async getBoardData() {
    try {
      this.getStageInProcess = true;
      const data = await this._sprintService.filterSprintTasks(this.filterSprintTasksRequest).toPromise();
      this.prepareBoardData(data);
      this.getStageInProcess = false;
    } catch (e) {
      this.getStageInProcess = false;
    }

  }

  private prepareBoardData(data: BaseResponseModel<Sprint>) {
    if (data.data) {
      data.data.membersCapacity.forEach(member => {
        member.user.isSelected = this.filterSprintTasksRequest.assigneeIds.includes(member.userId.toString());
      });
      data.data.columns.forEach((stage) => {
        stage.tasks.forEach((task) => {
          if (!task.task.priority) {
            task.task.priority = {
              name: null,
              color: '#6E829C'
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

  public async moveTask(task: SprintColumnTask, column: SprintColumn) {
    //push to target stage for ui
    column.tasks.push(task);

    //pop from source stage
    if (this.moveFromStage) {
      this.moveFromStage.tasks = this.moveFromStage.tasks.filter((ele) => {
        if (ele.taskId !== task.taskId) {
          return ele;
        }
      });
    }

    try {

      const json: MoveTaskToColumnModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.boardData.id,
        columnId: column.id,
        taskId: task.taskId
      };

      // console.log('json :', json);

      this.getStageInProcess = true;
      const result = await this._sprintService.moveTaskToStage(json).toPromise();
      this.prepareBoardData(result);
      this.moveFromStage = null;
      this.getStageInProcess = false;
    } catch (e) {

      // revert ui changes
      if (this.moveFromStage) {
        this.moveFromStage.tasks.push(task);
      }

      //pop from source stage
      column.tasks = column.tasks.filter((ele) => {
        if (ele.taskId !== task.taskId) {
          return ele;
        }
      });

      this.getStageInProcess = false;
    }
  }

  onDragStart(item: SprintColumn) {
    this.moveFromStage = item;
  }

  async onDragEnd($event, item: SprintColumn) {
    this.moveTask($event.data, item);
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
    this.isVisibleCloseSprint = true;
  }

  async closeSprint() {
    this.closeSprintInProcess = true;

    const closeSprintRequest = new CloseSprintModel();
    closeSprintRequest.projectId = this._generalService.currentProject.id;
    closeSprintRequest.sprintId = this.boardData.id;

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

  //---------------------------------------//

  public viewTask(task: Task) {
    this.router.navigateByUrl('dashboard/task/' + task.displayName);
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

  public showTimeLogModal(columnIndex: number, taskIndex: number, taskItem: Task) {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
    this.selectedTask = {
      columnIndex, taskIndex, taskItem
    };
  }

  public hideTimeLogModal(resp?: TaskTimeLogResponse) {
    if (resp) {
      this.boardData.columns[this.selectedTask.columnIndex].tasks[this.selectedTask.taskIndex].totalLoggedTime = resp.totalLoggedTime;
      this.boardData.columns[this.selectedTask.columnIndex].tasks[this.selectedTask.taskIndex].totalLoggedTimeReadable = resp.totalLoggedTimeReadable;

    }
    this.timelogModalIsVisible = false;
    this.selectedTask = {
      columnIndex: null, taskIndex: null, taskItem: null
    };
  }





  public async removeTaskToSprint(taskId:string) {
    try {

      return this.modal.confirm({
        nzTitle: 'Want to remove task from sprint?',
        nzContent: '',
        nzOnOk: () =>
          new Promise(async (resolve, reject) => {
            const json: RemoveTaskFromSprintModel = {
              projectId: this._generalService.currentProject.id,
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
      this.getStageInProcess = false;
    }
  }

  ngOnDestroy() {

  }

}
