import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CloseSprintModel, Mention, Project, Sprint } from '@aavantan-app/models';
import { GeneralService } from '../../services/general.service';
import { SprintService } from '../../services/sprint/sprint.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { UserQuery } from '../../../queries/user/user.query';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { untilDestroyed } from 'ngx-take-until-destroy';
import 'quill-mention';

@Component({
  selector: 'app-close-sprint',
  templateUrl: './modal-close-sprint.component.html',
  styleUrls: ['./modal-close-sprint.component.scss']
})
export class CloseSprintComponent implements OnInit, OnDestroy {
  @Input() public closeSprintModalIsVisible;
  @Input() public activeSprintData: Sprint;
  @Input() public currentProject: Project;

  @Output() toggleCloseSprintShow: EventEmitter<Sprint> = new EventEmitter<Sprint>();

  public closeSprintNewSprintForm: FormGroup;
  public sprintCloseInProcess: boolean;
  public closeSprintModeSelection = 'createNewSprint';
  public dateFormat = 'MM/dd/yyyy';


  /* Quill Editor */
  public atMentionUsers: Mention[] = [];
  public hashValues: Mention[] = [];
  public quillConfig = {};

  constructor(private _generalService: GeneralService,
              private _sprintService: SprintService,
              private _userQuery: UserQuery,
              private notification: NzNotificationService,
              private router: Router) {
  }


  ngOnInit() {
    this.closeSprintNewSprintForm = new FormGroup({
      projectId: new FormControl(this.currentProject.id, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      goal: new FormControl(null, [Validators.required]),
      duration: new FormControl(null, [Validators.required]),
      startedAt: new FormControl(null, []),
      endAt: new FormControl(null, []),
      createAndPublishNewSprint: new FormControl(true),
      updateMemberCapacity: new FormControl(false)
    });

    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentProject = res;
        this.initQilllConfig();
      }
    });

  }

  async closeSprint() {
    this.sprintCloseInProcess = true;

    const closeSprintRequest = new CloseSprintModel();
    closeSprintRequest.projectId = this.currentProject.id;
    closeSprintRequest.sprintId = this.activeSprintData.id;

    if (this.closeSprintModeSelection === 'createNewSprint') {
      closeSprintRequest.createNewSprint = true;

      const sprintForm = this.closeSprintNewSprintForm.getRawValue();
      if (sprintForm.duration) {
        sprintForm.startedAt = sprintForm.duration[0];
        sprintForm.endAt = sprintForm.duration[1];
        delete sprintForm.duration;
      }

      closeSprintRequest.sprint = sprintForm;

      // if update member capacity is true then get replace default member capacity with user updated member capacity
      if (sprintForm.updateMemberCapacity) {
        closeSprintRequest.sprint.membersCapacity = this.activeSprintData.membersCapacity;
        closeSprintRequest.updateMemberCapacity = true;
      }

      closeSprintRequest.createAndPublishNewSprint = sprintForm.createAndPublishNewSprint;
    } else {
      closeSprintRequest.createNewSprint = false;
    }

    try {
      await this._sprintService.closeSprint(closeSprintRequest).toPromise();
      this.sprintCloseInProcess = false;

      this.closeSprintModalIsVisible = false;
      this.router.navigate(['dashboard']);
    } catch (e) {
      this.sprintCloseInProcess = false;
      console.log(e);
    }
  }


  initQilllConfig() {

    if (this.currentProject.members.length > 0) {
      this.currentProject.members.forEach((ele) => {
        let name = ele.userDetails.firstName + ' ' + ele.userDetails.lastName;
        if (!ele.userDetails.firstName) {
          name = ele.userDetails.emailId;
        }
        this.atMentionUsers.push({
          id: ele.userId,
          value: name,
          link: ele.userDetails.profileLink ? ele.userDetails.profileLink : ''
        });
      });
    }
    this.quillConfig = {
      toolbar: {
        container: [
          ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
          [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
          [{ 'color': ['#333333', '#000000', 'red', 'green'] }],
          ['clean'],                                         // remove formatting button
        ]
      },
      mention: {
        allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
        mentionDenotationChars: ['@', '#'],
        source: (searchTerm, renderList, mentionChar) => {
          let values;

          if (mentionChar === '@') {
            values = this.atMentionUsers;
          } else {
            values = this.hashValues = this.atMentionUsers;
          }

          if (searchTerm.length === 0) {
            renderList(values, searchTerm);
          } else {
            const matches = [];
            for (let i = 0; i < values.length; i++)
              // tslint:disable-next-line:no-bitwise
              if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())) matches.push(values[i]);
            renderList(matches, searchTerm);
          }
        }
      },
      keyboard: {
        bindings: {
          shiftEnter: {
            key: 13,
            shiftKey: true, // Handle shift+enter
            handler: (range, context) => {

              console.log('shift+enter');
            }
          },
          enter: {
            key: 13, //Enter
            handler: (range, context) => {

              return true;
            }
          }
        }
      }
    }

  }


  onSelectionChanged = (event) => {
    if (event.oldRange == null) {
      this.onFocus();
    }
    if (event.range == null) {
      this.onBlur();
    }
  };

  onContentChanged = (event) => {
    const charCount = event.text.length;
    if (charCount > 250) {
      this.closeSprintNewSprintForm.get('goal').patchValue(event.text.substr(0,249));
      return;
    }
  };

  onFocus = () => {
    console.log('On Focus');
  };

  onBlur = () => {
    console.log('Blurred');
  };

//=========== end quill ============//


  handleCancel(): void {
    this.toggleCloseSprintShow.emit();
  }

  ngOnDestroy() {
  }
}

