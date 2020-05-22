import { BaseDbModel } from './base.model';

export class UserRoleModel extends BaseDbModel {
  _id?:string;
  id?:string;
  name: string;
  description?:string;
  projectId?:string;
  accessPermissions?: Permissions;
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
  board?: PermissionItem;
  member?: PermissionItem;
}

export class PermissionItem {
  [key: string]: boolean
}

export class ChangeAccessModel {
  projectId:string;
  userId: string;
  roleId:string;
}
