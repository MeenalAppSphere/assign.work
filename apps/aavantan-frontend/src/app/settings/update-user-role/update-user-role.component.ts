import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskService } from '../../shared/services/task/task.service';
import { GeneralService } from '../../shared/services/general.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AccessPermissionVM, Permissions, ProjectMembers, UserRoleModel } from '@aavantan-app/models';
import { ProjectService } from '../../shared/services/project/project.service';
import { TaskStatusService } from '../../shared/services/task-status/task-status.service';
import { PERMISSIONS } from '../../../../../../libs/models/src/lib/constants/permission';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserRoleQuery } from '../../queries/user-role/user-role.query';

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

  public permissionsList: AccessPermissionVM[] = [];
  public permissionsObj: Permissions = {};

  public selectedUserRole: UserRoleModel;
  public roleListDataSource:UserRoleModel[]= [];

  constructor(protected notification: NzNotificationService,
              private _taskService: TaskService,
              private _projectService: ProjectService,
              private _generalService: GeneralService,
              private _taskStatusService: TaskStatusService,
              private FB: FormBuilder, private _userRoleQuery: UserRoleQuery) {
  }

  ngOnInit() {

    // get all user roles from store
    this._userRoleQuery.roles$.pipe(untilDestroyed(this)).subscribe(roles => {
      this.roleListDataSource = roles;
    });


    this.userRoleForm = this.FB.group({
      id: new FormControl(null),
      name: new FormControl(null, [Validators.required]),
      permission: new FormControl([], [Validators.required]),
    });

    console.log('updateUserRoleData :',this.updateUserRoleData);
    if (this.updateUserRoleData) {
      // this.userRoleForm.get('name').patchValue();
      // this.userRoleForm.get('id').patchValue();
      this.generatePermissionsList(PERMISSIONS);
    }


    this.selectedUserRole = this.roleListDataSource[0];

  }

  public generatePermissionsList(permissionConstantObj:Permissions) {

    this.permissionsList = [];
    const recur = (obj: any, group: string) => {
      Object.keys(obj).forEach(key => {
        const name = key.match(/[A-Z][a-z]*/g).join(' '); // to format "canRemove" like " Remove"
        this.permissionsList.push({name:name, group: group, value: key, disabled: false, checked: obj[key] });
      });
    };

    Object.keys(permissionConstantObj).forEach(key => {
      if (typeof permissionConstantObj[key] !== 'boolean') {
        recur(permissionConstantObj[key], key);
      }
    });

    const groupByName = {};

    this.permissionsList.forEach(function (a) {
      groupByName[a.group] = groupByName[a.group] || [];
      groupByName[a.group].push({name:a.name, group: a.group, value: a.value, disabled: false, checked: a.checked });
    });

    this.permissionsObj = groupByName;
  }

  public selectRole(item: UserRoleModel) {
    this.selectedUserRole = item;
    this.generatePermissionsList(item.accessPermissions);
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
