import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskService } from '../../shared/services/task/task.service';
import { GeneralService } from '../../shared/services/general.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ProjectMembers, UserRoleModel } from '@aavantan-app/models';
import { ProjectService } from '../../shared/services/project/project.service';
import { TaskStatusService } from '../../shared/services/task-status/task-status.service';

@Component({
  selector: 'update-user-role',
  templateUrl: './update-user-role.component.html',
  styleUrls: ['./update-user-role.component.scss']
})
export class UpdateUserRoleComponent implements OnInit, OnDestroy {
  @Input() public updateUserRoleModalIsVisible: boolean = false;
  @Input() public updateUserRoleData: ProjectMembers;
  @Output() toggleUpdateUserRoleShow: EventEmitter<any> = new EventEmitter<any>();

  public userRoleForm: FormGroup;
  public updateRequestInProcess: boolean;

  public permissions= [
    { label: 'Create', value: 'create', disabled: true, checked: false },
    { label: 'Read', value: 'read', disabled: true, checked: true},
    { label: 'Write', value: 'write', disabled: true, checked: false},
    { label: 'Assign', value: 'assign', disabled: true, checked: false },
  ];

  public selectedUserRole: UserRoleModel;
  public roleListDataSource:UserRoleModel[]= [{
    name :'Member'
  },
  {
    name :'Developer'
  }];

  constructor(protected notification: NzNotificationService,
              private _taskService: TaskService,
              private _projectService: ProjectService,
              private _generalService: GeneralService,
              private _taskStatusService: TaskStatusService,
              private FB: FormBuilder) {
  }

  ngOnInit() {
    this.userRoleForm = this.FB.group({
      id: new FormControl(null),
      name: new FormControl(null, [Validators.required]),
      permission: new FormControl([], [Validators.required]),
    });

    console.log('updateUserRoleData :',this.updateUserRoleData);
    if (this.updateUserRoleData) {
      // this.userRoleForm.get('name').patchValue();
      // this.userRoleForm.get('id').patchValue();
    }


    this.selectedUserRole = this.roleListDataSource[0];

  }

  public selectRole(item: UserRoleModel) {
    this.selectedUserRole = item;
  }

  public selectPermissions(value:any) {
    console.log(value);
  }

  async save() {
    try {
      if (this.userRoleForm.invalid) {
        this.notification.error('Error', 'Please check all fields');
        return;
      }
      const json: UserRoleModel = this.userRoleForm.value;
      json.name = json.name.trim();
      this.updateRequestInProcess = true;

      if (this.updateUserRoleData && this.updateUserRoleData.userId) {

        this.updateRequestInProcess = true;

        // await this._taskStatusService.updateTaskStatus(json).toPromise();

        this.updateRequestInProcess = false;
        this.toggleUpdateUserRoleShow.emit();

      } else {
          // add api call if need here
      }
    }catch (e) {
      this.updateRequestInProcess = false;
    }

  }

  handleCancel(): void {
    this.toggleUpdateUserRoleShow.emit();
  }

  ngOnDestroy() {

  }

}
