import * as aws from 'aws-sdk';
import { DEFAULT_EMAIL_ADDRESS, DEFAULT_EMAIL_TEMPLATE_PATH } from '../helpers/defaultValueConstant';
import * as ejs from 'ejs';
import { resolvePathHelper } from '../helpers/helpers';


export class EmailService {
  private ses: aws.SES;

  constructor() {
    this.ses = new aws.SES({ apiVersion: '2010-12-01' });
  }

  /**
   * send email
   * @param to
   * @param subject
   * @param message
   */
  async sendMail(to: string[], subject: string, message: string) {
    const params = {
      Destination: {
        ToAddresses: to
      },
      Message: {
        Body: {
          Html: {
            Data: message,
            Charset: 'UTF-8'
          },
          Text: {
            Data: message,
            Charset: 'UTF-8'
          }
        },
        Subject: {
          Data: subject
        }
      },
      Source: DEFAULT_EMAIL_ADDRESS
    };

    return this.ses.sendEmail(params).promise();
  }

  async getTemplate(templatePath: string, templateData): Promise<string> {
    return ejs.renderFile(resolvePathHelper(`${DEFAULT_EMAIL_TEMPLATE_PATH}${templatePath}`), templateData);
  }

}
