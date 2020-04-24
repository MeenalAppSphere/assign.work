import * as aws from 'aws-sdk';
import { DEFAULT_EMAIL_ADDRESS, DEFAULT_EMAIL_TEMPLATE_PATH } from '../helpers/defaultValueConstant';
import * as ejs from 'ejs';
import { resolvePathHelper } from '../helpers/helpers';
import { BuildEmailConfigurationModel, SendEmailModel } from '@aavantan-app/models';


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

  /**
   * get template and convert's ejs to normal string
   * @param templatePath
   * @param templateData
   */
  async getTemplate(templatePath: string, templateData): Promise<string> {
    return ejs.renderFile(resolvePathHelper(`${DEFAULT_EMAIL_TEMPLATE_PATH}${templatePath}`), templateData);
  }

  /**
   * build and send email
   * build's email object from given input's and send it to all the recipients
   * @param configuration
   */
  async buildAndSendEmail(configuration: BuildEmailConfigurationModel) {
    // loop over all the recipients
    try {
      for (let i = 0; i < configuration.recipients.length; i++) {
        const emailObject: SendEmailModel = {
          to: [configuration.recipients[i]],
          subject: configuration.subject,
          message: await this.getTemplate(configuration.template, configuration.templateDetails[i])
        };

        this.sendMail(emailObject.to, emailObject.subject, emailObject.message);
      }
    } catch (e) {
      throw e;
    }
  }

}
