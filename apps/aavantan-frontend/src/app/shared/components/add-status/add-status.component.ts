import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskService } from '../../services/task/task.service';
import { GeneralService } from '../../services/general.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TaskStatusModel } from '@aavantan-app/models';
import { ProjectService } from '../../services/project/project.service';
import { TaskStatusService } from '../../services/task-status/task-status.service';
import { ColorEvent } from 'ngx-color';

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

  // for color picker
  public showColorBox: boolean;
  public primaryColor = '#000000';


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
      color: new FormControl(null, [Validators.required]),
      id: new FormControl(null),
      projectId: new FormControl(this._generalService.currentProject.id, [Validators.required]),
      description: new FormControl('')
    });

    if (this.addEditprojectStatusData) {
      this.primaryColor = this.addEditprojectStatusData.color;
      this.statusForm.get('name').patchValue(this.addEditprojectStatusData.name);
      this.statusForm.get('id').patchValue(this.addEditprojectStatusData.id);
      this.statusForm.get('color').patchValue(this.addEditprojectStatusData.color);
      this.statusForm.get('projectId').patchValue(this.addEditprojectStatusData.projectId);
      this.statusForm.get('description').patchValue(this.addEditprojectStatusData.description);
    }
  }

  async addStatus() {
    try {
      if (this.statusForm.invalid) {
        this.notification.error('Error', 'Please check Status Title');
        return;
      }
      const statusData: TaskStatusModel = this.statusForm.value;
      statusData.name = statusData.name.trim();
      this.updateRequestInProcess = true;

      if (this.addEditprojectStatusData && this.addEditprojectStatusData.id) {

        this.updateRequestInProcess = true;

        await this._taskStatusService.updateTaskStatus(statusData).toPromise();

        this.updateRequestInProcess = false;
        this.toggleAddStatusShow.emit();

      } else {

        await this._taskStatusService.createTaskStatus(statusData).toPromise();
        this.statusForm.reset();
        this.updateRequestInProcess = false;
        this.toggleAddStatusShow.emit();

      }
    }catch (e) {
      this.updateRequestInProcess = false;
    }

  }

  handleCancel(): void {
    this.toggleAddStatusShow.emit();
  }

  // color picker
  public toggleColor() {
    this.showColorBox = !this.showColorBox;
  }
  public clearColor() {
    this.primaryColor = '#000000';
    this.statusForm.get('color').patchValue(this.primaryColor);
    this.showColorBox = !this.showColorBox;
  }
  public changeComplete($event: ColorEvent) {
    this.primaryColor = $event.color.hex;
    this.statusForm.get('color').patchValue($event.color.hex);
  }

  ngOnDestroy() {

  }

}
