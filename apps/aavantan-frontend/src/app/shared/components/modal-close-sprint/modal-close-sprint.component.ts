import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CloseSprintModel, Project, Sprint } from '@aavantan-app/models';
import { GeneralService } from '../../services/general.service';
import { SprintService } from '../../services/sprint/sprint.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { UserQuery } from '../../../queries/user/user.query';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';

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

  handleCancel(): void {
    this.toggleCloseSprintShow.emit();
  }

  ngOnDestroy() {
  }
}

