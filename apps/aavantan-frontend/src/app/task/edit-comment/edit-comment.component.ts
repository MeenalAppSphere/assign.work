import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TaskComments, UpdateCommentModel } from '@aavantan-app/models';
import { TaskService } from '../../shared/services/task/task.service';
import { GeneralService } from '../../shared/services/general.service';

@Component({
  selector: 'app-edit-comment',
  templateUrl: './edit-comment.component.html',
  styleUrls: ['./edit-comment.component.scss']
})
export class EditCommentComponent implements OnInit {
  @Input() public editCommentModalIsVisible:boolean;
  @Input() public comment:TaskComments;
  @Input() public taskId:string;
  @Output() toggleEditCommentShow: EventEmitter<any> = new EventEmitter<any>();

  public savingInProcess:boolean;
  public commentForm:FormGroup;

  constructor(private _taskService:TaskService, private _generalService :GeneralService) {
    this.commentForm = new FormGroup({
      comment:new FormControl(null, [Validators.required]),
      id:new FormControl(null, [Validators.required])
    });

  }

  ngOnInit() {
    this.commentForm.get('comment').patchValue(this.comment.comment);
    this.commentForm.get('id').patchValue(this.comment.id);
  }

  async save() {
    this.savingInProcess = true;

    const comment: UpdateCommentModel = {
      projectId: this._generalService.currentProject.id,
      comment : this.commentForm.getRawValue(),

    };
    comment.taskId = this.taskId;

    try {
      const data = await this._taskService.updateComment(comment).toPromise();
      this.savingInProcess = false;
    } catch (e) {
      this.savingInProcess = false;
    }
    this.toggleEditCommentShow.emit(comment);

  }

  public handleCancel(): void {
    this.editCommentModalIsVisible =false;
  }

}
