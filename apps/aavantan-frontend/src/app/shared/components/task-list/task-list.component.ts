import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DraftSprint, Task } from '@aavantan-app/models';

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
  public selectedTaskItem:Task;
  //backlog page
  public tasksSelected: DraftSprint = {
    ids:[],
    tasks: [],
    duration: 0
  };
  constructor() {}

  ngOnInit() {}

  public timeLog(item:Task) {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
    this.selectedTaskItem=item;
  }

  public viewTask(task: Task) {

  }
  public selectTaskForSprint(task: Task) {
    const duration = task.estimate.split('h')[0];
    if (task.selectedForSprint && (this.tasksSelected.ids.indexOf(task.id))<1) {
      this.tasksSelected.tasks.push(task);
      this.tasksSelected.ids.push(task.id);
      this.tasksSelected.duration =
        this.tasksSelected.duration + Number(duration);
    } else {
      this.tasksSelected.ids=this.tasksSelected.ids.filter(ele => {
        return ele !== task.id;
      });
      this.tasksSelected.tasks=this.tasksSelected.tasks.filter(ele => {
        return ele.id !== task.id;
      });
      this.tasksSelected.duration =
        this.tasksSelected.duration - Number(duration);
    }
    this.tasksSelectedForDraftSprint.emit(this.tasksSelected);
  }
}
