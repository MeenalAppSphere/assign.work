import { EmailSubjectEnum } from '@aavantan-app/models';

export class SendEmailModel {
  to: string[];
  subject: EmailSubjectEnum;
  message: string;
}
