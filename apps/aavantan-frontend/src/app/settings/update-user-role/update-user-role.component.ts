import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskService } from '../../shared/services/task/task.service';
import { GeneralService } from '../../shared/services/general.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {
  AccessPermissionVM,
  Permissions,
  ProjectMembers,
  UserRoleModel, UserRoleUpdateRequestModel
} from '@aavantan-app/models';
import { ProjectService } from '../../shared/services/project/project.service';
import { TaskStatusService } from '../../shared/services/task-status/task-status.service';
import { PERMISSIONS } from '../../../../../../libs/models/src/lib/constants/permission';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserRoleQuery } from '../../queries/user-role/user-role.query';
import { UserRoleService } from '../../shared/services/user-role/user-role.service';

@Component({
  selector: 'update-user-role',
  templateUrl: './update-user-role.component.html',
  styleUrls: ['./update-user-role.component.scss']
})
export class UpdateUserRoleComponent implements OnInit, OnDestroy {
  @Input() public updateUserRoleModalIsVisible: boolean = false;
  @Input() public updateUserRoleData: ProjectMembers;
  @Output() toggleUpdateUserRoleShow: EventEmitter<any> = new EventEmitter<any>();

  public changeAccessForm: FormGroup;
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
              private FB: FormBuilder, private _userRoleQuery: UserRoleQuery,
              private _userRolesService: UserRoleService) {
  }

  ngOnInit() {

    // get all user roles from store
    this._userRoleQuery.roles$.pipe(untilDestroyed(this)).subscribe(roles => {
      this.roleListDataSource = roles;
    });

    if (this.updateUserRoleData.roleDetails) {
      // init/prepare all permissions list from 'roleDetails.accessPermissions' const to display
      this.generatePermissionsList(this.updateUserRoleData.roleDetails.accessPermissions);
    }else {
      //default from PERMISSIONS contant
      this.generatePermissionsList(PERMISSIONS);
    }

    this.selectedUserRole = this.updateUserRoleData.roleDetails;

  }



  //**********************//
  // Generate Permissions List from object
  //**********************//

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


  //**********************//
  // Select role from dropdown
  //**********************//
  public selectRole(item: UserRoleModel) {
    this.selectedUserRole = item;
    this.generatePermissionsList(item.accessPermissions);
  }


  //**********************//
  // Update role of collaborator
  //**********************//
  async saveAccess() {
    try {
      if (this.updateUserRoleData && !this.updateUserRoleData.userId) {
        this.notification.error('Error', 'Please check all fields');
        return;
      }

        const json: UserRoleUpdateRequestModel = {
          userRoleId: this.selectedUserRole.id,
          userId:this.updateUserRoleData.userId,
          projectId: this._generalService.currentProject.id
        };

        this.updateRequestInProcess = true;

        await this._userRolesService.changeAccess(json).toPromise();

        this.updateRequestInProcess = false;

        this.toggleUpdateUserRoleShow.emit();

    } catch (e) {
      this.updateRequestInProcess = false;
    }

  }

  handleCancel(): void {
    this.toggleUpdateUserRoleShow.emit();
  }

  ngOnDestroy() {

  }

}
