import { BaseDbModel } from './base.model';
import { RoleTypeEnum } from '../enums/role-type.enum';

export class UserRoleModel extends BaseDbModel {
  _id?:string;
  id?:string;
  name: string;
  description?:string;
  projectId?:string;
  accessPermissions?: Permissions;
  type?: RoleTypeEnum
}


export class AccessPermissionVM {
  name: string;
  disabled:boolean;
  checked:boolean;
  value:string;
  group:string;
}

export class Permissions {
  sprint?: PermissionItem;
  task?: PermissionItem;
  boardSettings?: PermissionItem;
  collaborators?: PermissionItem;
  project?: PermissionItem;
  status?: PermissionItem;
  priority?: PermissionItem;
  taskType?: PermissionItem;
  teamCapacity?:PermissionItem;
}

export class PermissionItem {
  [key: string]: boolean
}

export class UserRoleUpdateRequestModel {
  projectId:string;
  userRoleId:string;
  userId:string;
}
