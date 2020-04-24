import {
  BuildEmailConfigurationModel,
  EmailSubjectEnum,
  EmailTemplatePathEnum,
  Project,
  Task,
  TaskComments
} from '@aavantan-app/models';
import { BadRequest, getMentionedUsersFromString } from '../../helpers/helpers';
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

  /**
   * get mentioned users from comment
   * @param comment
   * @param taskDetails
   * @param projectDetails
   */
  public getMentionedUsersFromComment(comment: string, taskDetails: Task, projectDetails: Project) {
    let newWatchers = [];
    // check if comment has any @mention users
    const mentionsFromComment = getMentionedUsersFromString(comment);
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

  /**
   * send email for comments actions like
   * add comment, update comment, pin comment and un pin comment
   * @param task
   * @param project
   * @param comment
   * @param subject
   * @param type
   */
  async sendMailForComments(task: Task, project: Project, comment: TaskComments, subject: EmailSubjectEnum, type: string) {
    const emailConfiguration = new BuildEmailConfigurationModel(subject, EmailTemplatePathEnum.taskCommentAdded);

    // prepare data for sending mail
    for (const watcher of task.watchersDetails) {
      emailConfiguration.recipients.push(watcher.emailId);
      emailConfiguration.templateDetails.push({
        user: { firstName: watcher.firstName, lastName: watcher.lastName },
        task,
        project,
        comment,
        type,
        appUrl: environment.APP_URL
      });
    }

    this._emailService.buildAndSendEmail(emailConfiguration);
  }
}
