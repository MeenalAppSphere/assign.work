import {
  AddCommentModel,
  EmailSubjectEnum,
  EmailTemplatePathEnum,
  Project,
  SendEmailModel,
  Task,
  TaskComments
} from '@aavantan-app/models';
import { BadRequest, getMentionedUsersFromComment } from '../../helpers/helpers';
import { ProjectUtilityService } from '../project/project.utility.service';
import { environment } from '../../../environments/environment';
import { EmailService } from '../email.service';

export class TaskCommentUtilityService {
  private _emailService: EmailService;
  private _projectUtilityService: ProjectUtilityService;

  constructor() {
    this._emailService = new EmailService();
    this._projectUtilityService = new ProjectUtilityService();
  }

  addTaskValidations() {

  }

  /**
   * get mentioned users from comment
   * @param comment
   * @param taskDetails
   * @param projectDetails
   */
  public getMentionedUsersFromComment(comment: string, taskDetails: Task, projectDetails: Project) {
    let newWatchers = [];
    // check if comment has any @mention users
    const mentionsFromComment = getMentionedUsersFromComment(comment);
    // if we found users than add them to task watchers, so they will get notifications when a task is updated
    if (mentionsFromComment.length) {
      newWatchers = mentionsFromComment.filter(mentionedUser => {
        return !taskDetails.watchers.some(watcher => mentionedUser === watcher.toString());
      });

      // check every mentioned user is part of this project
      const isAllNewWatchersValid = newWatchers.every(watcher => {
        return this._projectUtilityService.userPartOfProject(watcher, projectDetails);
      });

      if (!isAllNewWatchersValid) {
        BadRequest('One of mentioned user in comment is not a part of this project');
      }
    }
    return newWatchers;
  }

  async sendMailForCommentAdded(task: Task, project: Project, comment: TaskComments) {

    // prepare watchers mail data
    const watchersEmailArray: SendEmailModel[] = [];
    for (const watcher of task.watchersDetails) {
      const taskCommentEmailTemplateData = {
        user: { firstName: watcher.firstName, lastName: watcher.lastName },
        task,
        project,
        comment,
        appUrl: environment.APP_URL
      };

      watchersEmailArray.push({
        to: [watcher.emailId],
        subject: EmailSubjectEnum.taskCommentAdded,
        message: await this._emailService.getTemplate(EmailTemplatePathEnum.taskCommentAdded, taskCommentEmailTemplateData)
      });
    }

    // send mail to all watcher
    watchersEmailArray.forEach(email => {
      this._emailService.sendMail(email.to, email.subject, email.message);
    });
  }

}
