import { Component, Input, OnInit } from '@angular/core';
import { TaskHistory } from '@aavantan-app/models';

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
