import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TaskComments, CommentPinModel, User } from '@aavantan-app/models';
import { TaskService } from '../../shared/services/task/task.service';
import { GeneralService } from '../../shared/services/general.service';

@Component({
  selector: 'aavantan-app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit {
  @Input() public enablePinButton: Boolean=false;
  @Input() public commentsList: TaskComments[]=[];
  @Input() public taskId: string;
  @Output() public isUpdateSuccess: EventEmitter<boolean> = new EventEmitter(true);

  public editCommentModalIsVisible:boolean;
  public commentData:TaskComments;
  public pinInProcess: boolean = false;
  public currentUser : User;

  constructor(private _taskService: TaskService, private _generalService: GeneralService) { }

  ngOnInit() {
    this.currentUser = this._generalService.user;
  }

  async pinMessage(item:TaskComments){

    const json: CommentPinModel ={
      projectId: this._generalService.currentProject.id,
      taskId: this.taskId,
      commentId: item.id,
      isPinned: !item.isPinned
    }

    this.pinInProcess=true;
    try {

      await this._taskService.pinComment(json).toPromise();
      this.isUpdateSuccess.emit();
      this.pinInProcess = false;

    } catch (e) {
      this.pinInProcess = false;
    }
  }

  public toggleEditModel(item:TaskComments){
    this.commentData=item;
    this.editCommentModalIsVisible=!this.editCommentModalIsVisible;
    this.isUpdateSuccess.emit();
  }

}
