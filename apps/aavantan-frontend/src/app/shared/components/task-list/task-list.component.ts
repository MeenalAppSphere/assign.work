import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DraftSprint, GetAllTaskRequestModel, Task, TaskFilterDto, TaskType } from '@aavantan-app/models';
import { Router } from '@angular/router';
import { GeneralService } from '../../services/general.service';
import { TaskService } from '../../services/task/task.service';

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

  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  @Output() tasksSelectedForDraftSprint: EventEmitter<any> = new EventEmitter<any>();
  public timelogModalIsVisible: boolean;
  public selectedTaskItem: Task;
  public sortingRequest: TaskFilterDto = {
    sort:'', sortBy:''
  };

  //backlog page
  public tasksSelected: DraftSprint = {
    ids: [],
    tasks: [],
    duration: 0
  };

  constructor(private router: Router, private _generalService : GeneralService, private _taskService:TaskService) {
  }

  ngOnInit() {
  }

  public timeLog(item: Task) {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
    this.selectedTaskItem = item;
  }

  public viewTask(task: Task) {
    this.router.navigateByUrl("dashboard/task/"+task.displayName);
  }

  public selectTaskForSprint(task: Task) {
    const duration = task.estimateTime;
    if (!task.sprint && (this.tasksSelected.ids.indexOf(task.id)) < 1) {

      this.tasksSelected.tasks.push(task);
      this.tasksSelected.ids.push(task.id);

      if(duration){
        this.tasksSelected.duration =
          this.tasksSelected.duration + Number(duration);
      }

    } else {

      this.tasksSelected.ids = this.tasksSelected.ids.filter(ele => {
        return ele !== task.id;
      });

      this.tasksSelected.tasks = this.tasksSelected.tasks.filter(ele => {
        return ele.id !== task.id;
      });

      this.taskList = this.tasksSelected.tasks.filter(ele => {
        return ele.id !== task.id;
      });

      if(duration){
        this.tasksSelected.duration =
          this.tasksSelected.duration - Number(duration);
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
