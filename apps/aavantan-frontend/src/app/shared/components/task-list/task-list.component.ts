import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Task } from '../../interfaces/task.interface';

@Component({
  selector: 'aavantan-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {

  @Input() public taskByUser: string;
  @Input() public taskList: Task[];
  @Input() public view: string;
  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {

  }

  public timeLog(){
    this.toggleTimeLogShow.emit();
  }

  public viewTask(task:Task){

  }
}
