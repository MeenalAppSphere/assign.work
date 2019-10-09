import { User } from './user.model';

export class Organization {
  name: string;
  description?: string;
  displayName?: string;
  logoUrl?: string;
  billableMemberCount?: number;
  activeMembersCount?: number;
  createdBy?: string | User;
  updatedBy?: string | User;
}
