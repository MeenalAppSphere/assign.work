import { User } from './user.model';

export class Organization {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  displayName?: string;
  logoUrl?: string;
  billableMemberCount?: number;
  activeMembersCount?: number;
  createdBy?: string | User;
  updatedBy?: string | User;
  members?: string[] | Array<Partial<User>>;
}
