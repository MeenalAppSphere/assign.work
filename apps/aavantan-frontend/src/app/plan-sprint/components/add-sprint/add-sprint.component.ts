import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CreateSprintModel, Mention, Project, Sprint } from '@aavantan-app/models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GeneralService } from '../../../shared/services/general.service';
import { UserQuery } from '../../../queries/user/user.query';
import { SprintService } from '../../../shared/services/sprint/sprint.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { untilDestroyed } from 'ngx-take-until-destroy';
import 'quill-mention';

@Component({
  selector: 'aavantan-app-add-sprint',
  templateUrl: './add-sprint.component.html',
  styleUrls: ['./add-sprint.component.scss']
})
export class AddSprintComponent implements OnInit, OnDestroy {
  @Input() public sprintModalIsVisible: boolean = false;
  @Input() public sprintData: Sprint;
  @Output() toggleShow: EventEmitter<Sprint> = new EventEmitter<Sprint>();

  public dateFormat = 'MM/dd/yyyy';
  public sprintForm: FormGroup;
  public createSprintInProcess: boolean;
  public currentProject: Project = null;

  /* Quill Editor */
  public atMentionUsers: Mention[] = [];
  public hashValues: Mention[] = [];
  public quillConfig = {};

  constructor(private _generalService: GeneralService,
              private _userQuery: UserQuery,
              private _sprintService: SprintService,
              protected notification: NzNotificationService) {
  }

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
    this.sprintForm = new FormGroup({
      projectId: new FormControl(this._generalService.currentProject.id, [Validators.required]),
      createdById: new FormControl(this._generalService.user.id, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      goal: new FormControl(null, [Validators.required]),
      sprintStatus: new FormControl(null, []),
      duration: new FormControl(null, [Validators.required]),
      startedAt: new FormControl(null, []),
      endAt: new FormControl(null, []),
    });
    if (this.sprintData && this.sprintData.id) {
      this.sprintForm.get('name').patchValue(this.sprintData.name);
      this.sprintForm.get('goal').patchValue(this.sprintData.goal);
      this.sprintForm.get('duration').patchValue([this.sprintData.startedAt, this.sprintData.endAt]);
    }

    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentProject = res;
        this.initQilllConfig();
      }
    });

  }

  async createSprint() {

    if (this.sprintForm.invalid) {
      this.notification.error('Error', 'Please check all mandatory fields');
      return;
    }

    const sprintForm = this.sprintForm.getRawValue();

    if (sprintForm.duration) {
      sprintForm.startedAt = sprintForm.duration[0];
      sprintForm.endAt = sprintForm.duration[1];
    }

    this.createSprintInProcess = true;
    const sprint: CreateSprintModel = {
      sprint: sprintForm
    };

    try {
      let createdSprint = null;

      if (this.sprintData.id) {
        sprint.sprint.id = this.sprintData.id;
        createdSprint = await this._sprintService.updateSprint(sprint).toPromise();
      } else {
        createdSprint = await this._sprintService.createSprint(sprint).toPromise();
      }

      this.sprintModalIsVisible = false;
      this.sprintData = createdSprint.data;
      this.createSprintInProcess = false;
      this.toggleShow.emit(this.sprintData);

    } catch (e) {
      this.createSprintInProcess = false;
    }

  }

  handleCancel(): void {
    this.sprintModalIsVisible = false;
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
      this.sprintForm.get('goal').patchValue(event.text.substr(0,249));
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

}
