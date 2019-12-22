import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AddTaskToSprintModel,
  DraftSprint,
  GetAllTaskRequestModel, RemoveTaskFromSprintModel, SprintErrorResponse,
  Task,
  TaskFilterDto,
  TaskTimeLogResponse,
  TaskType
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
  @Input() public showRemoveIcon: boolean;

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

    if(this.taskList && this.taskList.length>0 && this.taskList[0].isSelected){
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
    this.selectTaskForSprint(task); // api call to remove task from sprint
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

      // if(duration){
      //   this.tasksSelected.duration = this.tasksSelected.duration + Number(duration);
      //   this.tasksSelected.durationReadable = this._generalService.secondsToReadable(Number(this.tasksSelected.duration)).readable;
      //   this.tasksSelected.durationRemainingReadable = this._generalService.secondsToReadable(Number(this.tasksSelected.duration)).readable;
      // }

      this.addTaskToSprintModel(task); // api call to add task into sprint

    } else {

      this.tasksSelected.ids = this.tasksSelected.ids.filter(ele => {
        return ele !== task.id;
      });

      this.tasksSelected.tasks = this.tasksSelected.tasks.filter(ele => {
        return ele.id !== task.id;
      });

      task.isSelected = false;

      // if(duration){
      //   this.tasksSelected.duration = this.tasksSelected.duration - Number(duration);
      //   this.tasksSelected.durationReadable = this._generalService.secondsToReadable(Number(this.tasksSelected.duration)).readable;
      //   this.tasksSelected.durationRemainingReadable = this._generalService.secondsToReadable(Number(this.tasksSelected.duration)).readable;
      // }

      this.removeTaskFromSprint(task); // api call to remove task from sprint

    }
    this.tasksSelectedForDraftSprint.emit(this.tasksSelected);
  }

  public addTaskToSprintModel(task:Task){

    try {

      const sprintData : AddTaskToSprintModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.tasksSelected.sprintId,
        tasks : [task.id]
      }

      this._sprintService.addTaskToSprint(sprintData).toPromise();

    } catch (e) {
    }

  }

  public removeTaskFromSprint(task:Task){

    try {

      const sprintData : RemoveTaskFromSprintModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.tasksSelected.sprintId,
        tasks : [task.id]
      }

      this._sprintService.removeTaskToSprint(sprintData).toPromise();

    } catch (e) {
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
    console.log('Sorting Request: ',this.sortingRequest);
  }

}
