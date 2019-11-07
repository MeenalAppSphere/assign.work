import { Component, Input, OnInit } from '@angular/core';
import { TaskService } from '../../shared/services/task/task.service';
import { BaseResponseModel, TaskComments } from '@aavantan-app/models';

@Component({
  selector: 'aavantan-app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  @Input() public  taskId:string;
  public getHistoryInProcess:boolean = false;

  public data: BaseResponseModel<TaskComments[]>;

  constructor(private _taskService: TaskService) { }

  ngOnInit() {
    this.getHistory();
  }

  async getHistory(){
    this.getHistoryInProcess=true;
    try {
      this.data = await this._taskService.getHistory(this.taskId).toPromise();
      this.getHistoryInProcess = false;
    } catch (e) {
      this.getHistoryInProcess = false;
    }
  }

}
