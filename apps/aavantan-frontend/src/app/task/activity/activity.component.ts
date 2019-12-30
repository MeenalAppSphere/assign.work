import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TaskComments, CommentPinModel, User, UpdateCommentModel } from '@aavantan-app/models';
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
  @Output() public isUpdateSuccess: EventEmitter<CommentPinModel | UpdateCommentModel> = new EventEmitter<CommentPinModel | UpdateCommentModel>();

  public editCommentModalIsVisible:boolean;
  public commentData:UpdateCommentModel;
  public pinInProcess: boolean = false;
  public currentUser : User;

  constructor(private _taskService: TaskService, private _generalService: GeneralService) { }

  ngOnInit() {
    this.currentUser = this._generalService.user;
  }

  async pinMessage(item:TaskComments){
    let isPinned =true;
    if(item.isPinned){
      isPinned = false
    }
    item.isPinned = isPinned;
    const json: CommentPinModel ={
      projectId: this._generalService.currentProject.id,
      taskId: this.taskId,
      commentId: item.id,
      isPinned: isPinned,
      comment:item.comment
    }

    this.pinInProcess=true;
    try {

      this.isUpdateSuccess.emit(json);
      await this._taskService.pinComment(json).toPromise();
      this.pinInProcess = false;

    } catch (e) {
      this.pinInProcess = false;
    }
  }

  public openEditModel(item:UpdateCommentModel){
    this.commentData=item;
    this.editCommentModalIsVisible=!this.editCommentModalIsVisible;
  }

  public toggleEditModel(item:UpdateCommentModel){
    this.commentData=item;
    this.editCommentModalIsVisible=!this.editCommentModalIsVisible;
    this.isUpdateSuccess.emit(item);
  }

}
