import { BaseDbModel } from './base.model';

export class UserRoleModel extends BaseDbModel {
  _id?:string;
  id?:string;
  name: string;
  description?:string;
  projectId?:string;
  accessPermissions?:string[];
}


export class AccessPermission {
  _id?:string;
  id?:string;
  name: string;
  label?:string;
  disabled:boolean;
  checked:boolean;
  value:string;
}
