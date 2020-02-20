import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import {
  BaseResponseModel,
  GetAllTaskRequestModel,
  MoveTaskToColumnModel,
  ProjectStatus,
  Sprint,
  SprintColumn,
  SprintColumnTask,
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

@Component({
  selector: 'aavantan-app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnDestroy {

  public boardData: Sprint;
  public boardDataClone: Sprint;

  public timelogModalIsVisible: boolean;
  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  public selectedTaskItem: Task;
  public getStageInProcess: boolean;
  public taskTypeDataSource: TaskTypeModel[] = [];
  // close sprint modal
  public selectedSprintStatus: ProjectStatus;
  public statusSprintDataSource: ProjectStatus[] = [];
  public closeSprintModalIsVisible: boolean;
  public isVisibleCloseSprint: boolean;
  public radioOptionValue = 'a';
  public dateFormat = 'MM/dd/yyyy';
  public sprintForm: FormGroup;

  public moveFromStage: SprintColumn;

  constructor(private _generalService: GeneralService,
              private _sprintService: SprintService,
              private _taskTypeQuery : TaskTypeQuery,
              protected notification: NzNotificationService,
              private modalService: NzModalService,
              private _userQuery: UserQuery, private router: Router) {

    this._taskTypeQuery.types$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.taskTypeDataSource = res;
      }
    });

  }

  ngOnInit() {


    if (this._generalService.currentProject.sprintId && this._generalService.currentProject.id) {
      this.getBoardData();
    } else {
      this.notification.info('Info', 'Sprint not found');
    }

    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.statusSprintDataSource = res.settings.statuses;
      }
    });

    this.sprintForm = new FormGroup({
      projectId: new FormControl(this._generalService.currentProject.id, [Validators.required]),
      createdById: new FormControl(this._generalService.user.id, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      goal: new FormControl(null, [Validators.required]),
      sprintStatus: new FormControl(null, []),
      duration: new FormControl(null, [Validators.required]),
      startedAt: new FormControl(null, []),
      endAt: new FormControl(null, [])
    });

  }


  public filterTask(user: User) {
    user.isSelected = !user.isSelected;
    this.boardData = this.boardDataClone;

    if (this.boardData && this.boardData.columns && this.boardData.columns.length) {

      this.boardData.columns.forEach((column) => {

        if (column.tasks && column.tasks.length) {
          let tasks: SprintColumnTask[];

          tasks = column.tasks.filter((task) => {
            // console.log(task.task.assignee.emailId +'---'+ user.emailId)
            if (task.task.assigneeId && task.task.assignee.emailId === user.emailId) {
              return task;
            }
          });
          column.tasks = tasks;
        }

      });

    }

  }

  async getBoardData() {
    try {

      const json: GetAllTaskRequestModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this._generalService.currentProject.sprintId
      };

      this.getStageInProcess = true;
      const data = await this._sprintService.getBoardData(json).toPromise();
      this.prepareBoardData(data);
      this.getStageInProcess = false;
    } catch (e) {
      this.getStageInProcess = false;
    }

  }

  private prepareBoardData(data: BaseResponseModel<Sprint>) {
    if (data.data) {
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

  handleOk(): void {
    this.isVisibleCloseSprint = false;
  }

  handleCancel(): void {
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
      this.notification.error('Info', 'Please create Stages, Task Types, Status, Priority from settings');
      setTimeout(() => {
        this.router.navigateByUrl('dashboard/settings');
      }, 1000);
      return;
    }
    this.router.navigateByUrl('dashboard/task/' + displayName);
  }

  public timeLog(item: Task) {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
    this.selectedTaskItem = item;
  }


  ngOnDestroy() {

  }

}
