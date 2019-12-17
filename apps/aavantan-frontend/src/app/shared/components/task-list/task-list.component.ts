import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  DraftSprint,
  GetAllTaskRequestModel,
  Task,
  TaskFilterDto,
  TaskTimeLogResponse,
  TaskType
} from '@aavantan-app/models';
import { Router } from '@angular/router';
import { GeneralService } from '../../services/general.service';
import { TaskService } from '../../services/task/task.service';
import { NzNotificationService } from 'ng-zorro-antd';

@Component({
  selector: 'aavantan-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  @Input() public taskByUser: string;
  @Input() public taskList: Task[];
  @Input() public view: string;
  @Input() public showLogOption: Boolean = true;
  @Input() public showCheckboxOption: Boolean = false;
  @Input() public showProgressOption: Boolean = true;
  @Input() public showSorting: Boolean = false;
  @Input() public sprintId: string;

  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  @Output() tasksSelectedForDraftSprint: EventEmitter<any> = new EventEmitter<any>();
  public timelogModalIsVisible: boolean;
  public selectedTaskItem: Task;
  public sortingRequest: TaskFilterDto = {
    sort:'', sortBy:''
  };

  //backlog page
  public tasksSelected: DraftSprint = {
    sprintId:null,
    ids: [],
    tasks: [],
    duration: 0,
    durationReadable:"",
    durationRemainingReadable:""
  };

  constructor(protected notification: NzNotificationService, private router: Router, private _generalService : GeneralService, private _taskService:TaskService) {
  }

  ngOnInit() {

    this.tasksSelected = {
      sprintId:this.sprintId,
      ids: [],
      tasks: [],
      duration: 0,
      durationReadable:"",
      durationRemainingReadable:""
    };

    console.log(this.taskList);
    console.log(this.tasksSelected);

  }

  public timeLog(item: Task) {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
    this.selectedTaskItem = item;
  }
  public toggleTimeLog(data:TaskTimeLogResponse, item:Task){
    item.progress = data.progress
  }

  public viewTask(task: Task) {
    this.router.navigateByUrl("dashboard/task/"+task.displayName);
  }

  public selectTaskForSprint(task: Task) {
    if(!this.tasksSelected.sprintId){
      this.notification.error('Error', 'Create a new Sprint to add tasks');
      return;
    }
    const duration = task.estimatedTime;
    if (!task.sprint && (this.tasksSelected.ids.indexOf(task.id)) < 0) {

      this.tasksSelected.tasks.push(task);
      this.tasksSelected.ids.push(task.id);

      if(duration){
        this.tasksSelected.duration =
          this.tasksSelected.duration + Number(duration);
          this.tasksSelected.durationReadable = this._generalService.secondsToReadable(Number(this.tasksSelected.duration)).readable;
          this.tasksSelected.durationRemainingReadable = this._generalService.secondsToReadable(Number(this.tasksSelected.duration)).readable;
      }

    } else {

      this.tasksSelected.ids = this.tasksSelected.ids.filter(ele => {
        return ele !== task.id;
      });

      this.tasksSelected.tasks = this.tasksSelected.tasks.filter(ele => {
        return ele.id !== task.id;
      });

      // this.taskList = this.tasksSelected.tasks.filter(ele => {
      //   return ele.id !== task.id;
      // });

      task.isSelected = false;

      if(duration){
        this.tasksSelected.duration =
          this.tasksSelected.duration - Number(duration);
          this.tasksSelected.durationReadable = this._generalService.secondsToReadable(Number(this.tasksSelected.duration)).readable;
        this.tasksSelected.durationRemainingReadable = this._generalService.secondsToReadable(Number(this.tasksSelected.duration)).readable;
      }

    }
    this.tasksSelectedForDraftSprint.emit(this.tasksSelected);
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
    console.log('Sorting Request: ',this.sortingRequest);
  }

}
