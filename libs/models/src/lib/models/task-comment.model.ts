import { AttachmentModel, Task, User } from '@aavantan-app/models';

export class TaskCommentModel {
  uuid?: number;
  id?: string;
  _id?: string;
  comment: string;
  taskId: string;
  task?: Task;
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
  updatedById?: string;
  updatedBy?: User;
  attachments?: string[];
  attachmentsDetails?: AttachmentModel[];
  isPinned: boolean;
  pinnedById?: string;
  pinnedBy?: User;
  pinnedAt?: Date;
}
