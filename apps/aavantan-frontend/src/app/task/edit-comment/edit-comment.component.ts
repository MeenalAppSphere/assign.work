import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Mention, TaskComments, UpdateCommentModel } from '@aavantan-app/models';
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

  /* Quill Editor */
  public atMentionUsers: Mention[] = [];
  public hashValues: Mention[] = [];
  public quillConfig={};
  /* end Quill Editor */

  constructor(private _taskService:TaskService, private _generalService :GeneralService) {
    this.commentForm = new FormGroup({
      comment:new FormControl(null, [Validators.required]),
      id:new FormControl(null, [Validators.required]),
      uuid: new FormControl(Date.now())
    });

  }

  ngOnInit() {
    this.commentForm.get('comment').patchValue(this.comment.comment);
    this.commentForm.get('id').patchValue(this.comment.id);
    this.commentForm.get('uuid').patchValue(this.comment.uuid);
    this.initQilllConfig();
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


  public initQilllConfig(){

    if(this._generalService.currentProject.members.length>0){
      this._generalService.currentProject.members.forEach((ele)=>{
        this.atMentionUsers.push({
          id:ele.userId,
          value: ele.userDetails.firstName+' '+ele.userDetails.lastName,
          link: ele.userDetails.profileLink ? ele.userDetails.profileLink : ''
        });
      });
    }


    this.quillConfig = {
      toolbar: {
        container: [
          ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
          ['code-block'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          [{ 'color': ['#333333', '#000000', 'red', 'green'] }],
          ['clean'],                                         // remove formatting button
          ['link', 'image', 'video']
            ['emoji'],
        ],
        handlers: {'emoji': function() {}}
      },
      mention: {
        allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
        mentionDenotationChars: ["@", "#"],
        source: (searchTerm, renderList, mentionChar) => {
          let values;

          if (mentionChar === "@") {
            values = this.atMentionUsers;
          } else {
            values = this.hashValues = this.atMentionUsers;
          }

          if (searchTerm.length === 0) {
            renderList(values, searchTerm);
          } else {
            const matches = [];
            for (let i = 0; i < values.length; i++)
              if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())) matches.push(values[i]);
            renderList(matches, searchTerm);
          }
        },
      },
      keyboard: {
        bindings: {
          shiftEnter: {
            key: 13,
            shiftKey: true, // Handle shift+enter
            handler: (range, context) => {

              console.log("shift+enter")
            }
          },
          enter:{
            key:13, //Enter
            handler: (range, context)=>{

              return true;
            }
          }
        }
      }
    }

  }

  onSelectionChanged = (event) =>{
    if(event.oldRange == null){
      this.onFocus();
    }
    if(event.range == null){
      this.onBlur();
    }
  }

  onContentChanged = (event) =>{
    //console.log(event.html);
  }

  onFocus = () =>{
    console.log("On Focus");
  }
  onBlur = () =>{
    console.log("Blurred");
  }

  //=========== end quill ============//

}
