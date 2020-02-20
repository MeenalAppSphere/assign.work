import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AddTaskToSprintModel,
  DraftSprint,
  GetAllTaskRequestModel,
  RemoveTaskFromSprintModel,
  Task,
  TaskFilterDto,
  TaskTimeLogResponse
} from '@aavantan-app/models';
import { Router } from '@angular/router';
import { GeneralService } from '../../services/general.service';
import { TaskService } from '../../services/task/task.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { SprintService } from '../../services/sprint/sprint.service';

@Component({
  selector: 'aavantan-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  @Input() public taskByUser: string;
  @Input() public taskList: Task[];
  @Input() public view: string;
  @Input() public showLogOption: boolean = true;
  @Input() public showCheckboxOption: boolean = false;
  @Input() public showProgressOption: boolean = true;
  @Input() public showSorting: boolean = false;
  @Input() public sprintId: string;
  @Input() public activeSprintId: string;
  @Input() public isDraftTable: boolean;

  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  @Output() tasksSelectedForDraftSprint: EventEmitter<any> = new EventEmitter<any>();

  public timelogModalIsVisible: boolean;
  public selectedTaskItem: Task;
  public sortingRequest: TaskFilterDto = {
    sort: '', sortBy: ''
  };

  public addTaskToSprintInProgress: boolean;
  public removeTaskFromSprintInProgress: boolean;

  //backlog page
  public tasksSelected: DraftSprint = {
    sprintId: null,
    ids: [],
    tasks: [],
    duration: 0
  };

  constructor(protected notification: NzNotificationService,
              private router: Router,
              private _generalService: GeneralService,
              private _sprintService: SprintService,
              private _taskService: TaskService) {
  }

  ngOnInit() {

    if (this.isDraftTable) {
      this.taskList.forEach((ele) => {
        if (ele.isSelected) {
          this.tasksSelected.ids.push(ele.id);
          this.tasksSelected.tasks.push(ele);
        }
      });
      this.tasksSelected.sprintId = this.sprintId;
    } else {
      this.tasksSelected = {
        sprintId: this.sprintId,
        ids: [],
        tasks: [],
        duration: 0
      };
    }
  }

  public timeLog(item: Task) {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
    this.selectedTaskItem = item;
  }

  public toggleTimeLog(data: TaskTimeLogResponse, item: Task) {
    item.progress = data.progress;
  }

  public viewTask(task: Task) {
    this.router.navigateByUrl('dashboard/task/' + task.displayName);
  }

  public deselectTaskFromSprint(task: Task) {
    this.removeTaskFromSprint(task);
  }

  public selectTaskForSprint(task: Task, bool: boolean) {
    if (this.tasksSelected.sprintId || this.activeSprintId || this.sprintId) {

      const taskIndex = this.tasksSelected.tasks.findIndex(t => t.id === task.id);
      if (taskIndex === -1) {
        this.addTaskToSprint(task);
      } else {
        this.tasksSelected.tasks[taskIndex].isSelected = bool;
      }
    } else {
      this.notification.error('Error', 'Create a new Sprint to add tasks');
      return;
    }
  }

  async addTaskToSprint(task: Task) {

    try {
      const json: AddTaskToSprintModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.tasksSelected.sprintId || this.activeSprintId || this.sprintId,
        adjustHoursAllowed: false,
        taskId: task.id
      };
      this.addTaskToSprintInProgress = true;
      const result = await this._sprintService.addTaskToSprint(json).toPromise();
      this.tasksSelected.tasks.push(task);
      this.tasksSelectedForDraftSprint.emit(this.tasksSelected);
      this.addTaskToSprintInProgress = false;
    } catch (e) {
      this.addTaskToSprintInProgress = false;
    }
  }

  async removeTaskFromSprint(task: Task) {

    try {
      const json: RemoveTaskFromSprintModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.tasksSelected.sprintId ? this.tasksSelected.sprintId : this.activeSprintId,
        taskId: task.id
      };
      this.removeTaskFromSprintInProgress = true;
      const result = await this._sprintService.removeTaskFromSprint(json).toPromise();
      task.isSelected = false;
      this.selectTaskForSprint(task, false);
      this.tasksSelectedForDraftSprint.emit(this.tasksSelected);
      this.removeTaskFromSprintInProgress = false;
    } catch (e) {
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
}
