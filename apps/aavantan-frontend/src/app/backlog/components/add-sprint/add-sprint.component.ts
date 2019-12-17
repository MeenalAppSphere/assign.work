import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CreateSprintModel, Sprint } from '@aavantan-app/models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GeneralService } from '../../../shared/services/general.service';
import { UserQuery } from '../../../queries/user/user.query';
import { SprintService } from '../../../shared/services/sprint/sprint.service';
import { NzNotificationService } from 'ng-zorro-antd';


@Component({
  selector: 'aavantan-app-add-sprint',
  templateUrl: './add-sprint.component.html',
  styleUrls: ['./add-sprint.component.scss']
})
export class AddSprintComponent implements OnInit, OnDestroy {
  @Input() public sprintModalIsVisible: boolean = false;
  @Input() public sprintData:Sprint;
  @Output() toggleShow: EventEmitter<Sprint> = new EventEmitter<Sprint>();

  public dateFormat = 'mm/dd/yyyy';
  public sprintForm: FormGroup;
  public createSprintInProcess: boolean;


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

    // Sprint wizard data
    this.sprintData = {
      name: null,
      projectId: this._generalService.currentProject.id,
      createdById: this._generalService.user.id,
      goal: null,
      startedAt: null,
      endAt: null,
      sprintStatus:null
    };
  }

  async createSprint() {

    if (this.sprintForm.invalid) {
      this.notification.error('Error', 'Please check all mandatory fields');
      return;
    }

    const sprintForm = this.sprintForm.getRawValue();

    if(sprintForm.duration) {
      sprintForm.startedAt = sprintForm.duration[0];
      sprintForm.endAt = sprintForm.duration[1];
    }

    this.createSprintInProcess = true;
    const sprint: CreateSprintModel = {
      sprint : sprintForm
    };

    try {
      const createdSprint = await this._sprintService.createSprint(sprint).toPromise();

      this.sprintModalIsVisible = false;
      this.sprintData = createdSprint.data;
      this.createSprintInProcess = false;
      this.toggleShow.emit(this.sprintData);

    } catch (e) {
      // this.createSprintInProcess = false;
    }

  }


  handleCancel(): void {
    this.sprintModalIsVisible = false;
  }

}
