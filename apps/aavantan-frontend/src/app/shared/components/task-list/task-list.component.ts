import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Task, TasksSelectedForSprint } from '../../interfaces/task.interface';

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
  @Input() public showProgressOption: Boolean = true;

  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  @Output() tasksSelectedForSprint: EventEmitter<any> = new EventEmitter<any>();

  //backlog page
  public tasksSelected: TasksSelectedForSprint = {
    ids: [],
    duration: 0
  };
  constructor() {}

  ngOnInit() {}

  public timeLog() {
    this.toggleTimeLogShow.emit();
  }

  public viewTask(task: Task) {}
  public selectTaskForSprint(task: Task) {
    const duration = task.estimate.split('h')[0];
    if (task.selectedForSprint && (this.tasksSelected.ids.indexOf(task._id))<1) {
      this.tasksSelected.ids.push(task._id);
      this.tasksSelected.duration =
        this.tasksSelected.duration + Number(duration);
    } else {
      this.tasksSelected.ids=this.tasksSelected.ids.filter(ele => {
        return ele !== task._id;
      });
      this.tasksSelected.duration =
        this.tasksSelected.duration - Number(duration);
    }
    console.log(this.tasksSelected.ids);
    this.tasksSelectedForSprint.emit(this.tasksSelected);
  }
}
