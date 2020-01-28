import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DraftSprint, GetAllTaskRequestModel, Task, TaskFilterDto, TaskTimeLogResponse } from '@aavantan-app/models';
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
  @Input() public isDraftTable: boolean;

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
    duration: 0
  };

  constructor(protected notification: NzNotificationService,
              private router: Router,
              private _generalService : GeneralService,
              private _sprintService: SprintService,
              private _taskService:TaskService) {
  }

  ngOnInit() {

    if(this.isDraftTable){
      this.taskList.forEach((ele)=>{
        if(ele.isSelected){
          this.tasksSelected.ids.push(ele.id);
          this.tasksSelected.tasks.push(ele);
        }
      })
      this.tasksSelected.sprintId = this.sprintId;
    }else{
      this.tasksSelected = {
        sprintId:this.sprintId,
        ids: [],
        tasks: [],
        duration: 0
      };
    }

    console.log(this.taskList);
    console.log(new Date(),this.tasksSelected);

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

  public deselectTaskFromSprint(task: Task) {
    task.isSelected = false;
    this.selectTaskForSprint(task, false);
  }


  public selectTaskForSprint(task: Task, bool: boolean) {
    if(!this.tasksSelected.sprintId){
      this.notification.error('Error', 'Create a new Sprint to add tasks');
      return;
    }

    const taskIndex = this.tasksSelected.tasks.findIndex(t => t.id === task.id);
    if (taskIndex === -1) {
      this.tasksSelected.tasks.push(task);
    } else {
      this.tasksSelected.tasks[taskIndex].isSelected = bool;
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
