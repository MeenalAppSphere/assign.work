import { EmailSubjectEnum, EmailTemplatePathEnum } from '@aavantan-app/models';

export class SendEmailModel {
  to: string[];
  subject: EmailSubjectEnum;
  message: string;
}

export class BuildEmailConfigurationModel {
  recipients: string[];
  templateDetails: any[];

  constructor(public subject: EmailSubjectEnum, public template: EmailTemplatePathEnum) {
    this.recipients = [];
    this.templateDetails = [];
  }
}
