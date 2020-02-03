import { User } from '@aavantan-app/models';

export class BaseUserModel {

}

export class BaseDbModel {
  _id?: string;
  id?: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  createdById: string;
  createdBy?: User;
  updatedById: string;
  updatedBy: User;
}
