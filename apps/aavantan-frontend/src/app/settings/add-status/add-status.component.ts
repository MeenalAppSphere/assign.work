import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskService } from '../../shared/services/task/task.service';
import { GeneralService } from '../../shared/services/general.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TaskStatusModel } from '@aavantan-app/models';
import { ProjectService } from '../../shared/services/project/project.service';
import { TaskStatusService } from '../../shared/services/task-status/task-status.service';

@Component({
  selector: 'aavantan-add-status',
  templateUrl: './add-status.component.html',
  styleUrls: ['./add-status.component.scss']
})
export class AddStatusComponent implements OnInit, OnDestroy {
  @Input() public addStatusModalIsVisible: boolean = false;
  @Input() public addEditprojectStatusData: TaskStatusModel;
  @Output() toggleAddStatusShow: EventEmitter<any> = new EventEmitter<any>();

  public statusForm: FormGroup;
  public updateRequestInProcess: boolean;

  constructor(protected notification: NzNotificationService,
              private _taskService: TaskService,
              private _projectService: ProjectService,
              private _generalService: GeneralService,
              private _taskStatusService: TaskStatusService,
              private FB: FormBuilder) {
  }

  ngOnInit() {
    this.statusForm = this.FB.group({
      name: new FormControl(null, [Validators.required]),
      id: new FormControl(null),
      projectId: new FormControl(this._generalService.currentProject.id, [Validators.required]),
      description: new FormControl('')
    });

    if (this.addEditprojectStatusData) {
      this.statusForm.get('name').patchValue(this.addEditprojectStatusData.name);
      this.statusForm.get('id').patchValue(this.addEditprojectStatusData.id);
      this.statusForm.get('projectId').patchValue(this.addEditprojectStatusData.projectId);
      this.statusForm.get('description').patchValue(this.addEditprojectStatusData.description);
    }
  }

  public addStatus() {
    if (this.statusForm.invalid) {
      this.notification.error('Error', 'Please check Status title');
      return;
    }
    const statusData: TaskStatusModel = this.statusForm.value;
    statusData.name = statusData.name.trim();
    this.updateRequestInProcess = true;

    if (this.addEditprojectStatusData && this.addEditprojectStatusData.id) {
      console.log('Updated status :', statusData);
      this.updateRequestInProcess = false;
      this.toggleAddStatusShow.emit();
    } else {
      this._taskStatusService.createTaskStatus(statusData).subscribe((res => {
        this.statusForm.reset();
        this.updateRequestInProcess = false;
        this.toggleAddStatusShow.emit();
      }), (error => {
        this.updateRequestInProcess = false;
      }));
    }

  }

  handleCancel(): void {
    this.toggleAddStatusShow.emit();
  }

  ngOnDestroy() {

  }

}
