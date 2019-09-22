import { Member } from './member.interface';

export interface Task {
  _id: string;
  name: string;
  shortLink?: string;
  closed?: boolean;
  dateLastActivity?: Date;
  description?:string;
  dueReminder?: string;
  due?: Date;
  dueComplete?: boolean;
  stageId?:string;
  projectId?: string;
  position?: number;
  priority?: string;
  labelsId?: any[];
  comments?: any[];
  assigned?: Member[];
  shortUrl?: string;
  url?: string;
  labels?: Labels[];
  attachments?: TaskAttachement[];
  createdAt?: Date;
  updatedAt?: Date;
  progress?:number;
  status?:string;
}

export interface Labels{
  _id:string;
  projectId:string;
  name:string;
  color: string;
}

export interface TaskAttachement {
  _id: string;
  memberId:string;
  isUpload: boolean;
  mimeType: string;
  name: string;
  url: string;
  createdAt: Date;
}
