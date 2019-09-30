import { Component, Input, OnInit } from '@angular/core';
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

  constructor() { }

  ngOnInit() {

  }

  public viewTask(task:Task){

  }
}
