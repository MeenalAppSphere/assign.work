import { Member } from './member.interface';

export interface ProjectRequest {
  _id?: string;
  projectName: string;
  projectAccess?: string;
  projectVersion?: string;
  isActive?: boolean;
  members: Member[];
  createdBy?: string;
  updatedBy?: string;
}
