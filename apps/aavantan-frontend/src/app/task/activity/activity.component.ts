import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TaskComments } from '@aavantan-app/models';
import { TaskService } from '../../shared/services/task/task.service';

@Component({
  selector: 'aavantan-app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit {
  @Input() public enablePinButton: Boolean=false;
  @Input() public commentsList: TaskComments[]=[];
  @Input() public taskId: string;
  @Output() public isPinnedSuccess: EventEmitter<boolean> = new EventEmitter(true);

  public pinInProcess: boolean = false;

  constructor(private _taskService: TaskService) { }

  ngOnInit() {

  }

  async pinMessage(item:TaskComments){
    const json={
      commentId:item.id,
      isPinned:!item.isPinned
    }
    this.pinInProcess=true;
    try {
      await this._taskService.pinComment(this.taskId, json).toPromise();
      this.isPinnedSuccess.emit();
      this.pinInProcess = false;
    } catch (e) {
      this.pinInProcess = false;
    }
  }

}
