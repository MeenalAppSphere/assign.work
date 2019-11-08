import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TaskService } from '../../shared/services/task/task.service';
import { BaseResponseModel, TaskComments, TaskHistory } from '@aavantan-app/models';

@Component({
  selector: 'aavantan-app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  @Input() public taskId:string;
  @Input() public historyList: TaskHistory[]=[];

  constructor() { }

  ngOnInit() {

  }

}
