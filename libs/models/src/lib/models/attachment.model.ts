import { User } from '@aavantan-app/models';

export class AttachmentModel {
  id?: string;
  name: string;
  mimeType: string;
  url: string;
  createdBy: string | User;
}
