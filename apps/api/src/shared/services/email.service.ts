import * as aws from 'aws-sdk';
import { DEFAULT_EMAIL_ADDRESS } from '../helpers/defaultValueConstant';

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
            Data: message
          },
          Text: {
            Data: message
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

}
