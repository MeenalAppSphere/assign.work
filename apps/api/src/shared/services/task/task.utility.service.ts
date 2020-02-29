import {
  EmailSubjectEnum,
  EmailTemplatePathEnum,
  Project,
  SendEmailModel,
  Task,
  TaskFilterCondition,
  TaskFilterModel
} from '@aavantan-app/models';
import { BoardUtilityService } from '../board/board.utility.service';
import { EmailService } from '../email.service';
import { environment } from '../../../environments/environment';
import { ProjectUtilityService } from '../project/project.utility.service';
import { toObjectId } from '../../helpers/helpers';

export class TaskUtilityService {
  private _boardUtilityService: BoardUtilityService;
  private _emailService: EmailService;
  private _projectUtilityService: ProjectUtilityService;

  constructor() {
    this._boardUtilityService = new BoardUtilityService();
    this._emailService = new EmailService();
    this._projectUtilityService = new ProjectUtilityService();
  }

  /**
   * prepare task object for saving to db
   * @param model
   * @param project
   */
  prepareTaskObjectFromRequest(model: Task, project: Project): Task {
    const taskModel = new Task();
    taskModel.name = model.name;
    taskModel.projectId = model.projectId;
    taskModel.watchers = model.watchers || [];
    taskModel.description = model.description;
    taskModel.tags = model.tags;

    taskModel.taskTypeId = model.taskTypeId;
    taskModel.priorityId = model.priorityId;

    // if no status found than assign project's active board first column's status as default status
    taskModel.statusId = model.statusId || project.activeBoard.columns[0].headerStatusId;

    taskModel.sprintId = null;

    taskModel.dependentItemId = model.dependentItemId;
    taskModel.relatedItemId = model.relatedItemId || [];

    taskModel.estimatedTime = 0;
    taskModel.remainingTime = 0;
    taskModel.overLoggedTime = 0;
    taskModel.totalLoggedTime = 0;
    taskModel.progress = 0;
    taskModel.overProgress = 0;

    return taskModel;
  }

  /**
   * send email when task is created and assigned to someone
   * @param task
   * @param project
   */
  async sendMailForTaskCreated(task: Task, project: Project) {
    await this.sendMailForTaskAssigned(task, project);

    // send mail to all task watchers except task assignee
    task.watchersDetails = task.watchersDetails.filter(watcher => {
      return watcher._id.toString() !== task.assigneeId.toString();
    });

    // prepare watchers mail data
    const watchersEmailArray: SendEmailModel[] = [];
    for (const watcher of task.watchersDetails) {
      const taskWatchersEmailTemplateData = {
        user: { firstName: watcher.firstName, lastName: watcher.lastName },
        task,
        project,
        appUrl: environment.APP_URL
      };

      watchersEmailArray.push({
        to: [watcher.emailId],
        subject: EmailSubjectEnum.taskCreated,
        message: await this._emailService.getTemplate(EmailTemplatePathEnum.taskCreated, taskWatchersEmailTemplateData)
      });
    }

    // send mail to all watcher
    watchersEmailArray.forEach(email => {
      this._emailService.sendMail(email.to, email.subject, email.message);
    });
  }

  /**
   * send email when a task is assigned to someone
   * @param task
   * @param project
   */
  public async sendMailForTaskAssigned(task: Task, project: Project) {
    // send task assignee email
    const taskAssigneeEmailTemplateData = {
      task,
      project,
      appUrl: environment.APP_URL
    };

    const taskAssigneeEmailObject: SendEmailModel = {
      to: [task.assignee.emailId],
      subject: EmailSubjectEnum.taskAssigned,
      message: await this._emailService.getTemplate(EmailTemplatePathEnum.taskAssigned, taskAssigneeEmailTemplateData)
    };

    // send email to task assignee
    this._emailService.sendMail(taskAssigneeEmailObject.to, taskAssigneeEmailObject.subject, taskAssigneeEmailObject.message);
  }

  /**
   * send email when a task is updated
   * @param task
   * @param project
   */
  async sendMailForTaskUpdated(task: Task, project: Project) {
    if (!task.updatedBy) {
      return;
    }
    const sendEmailArrays: SendEmailModel[] = [];

    // send mail to all task watchers except task assignee
    task.watchersDetails = task.watchersDetails.filter(watcher => {
      return watcher._id.toString() !== task.assigneeId.toString();
    });

    for (const watcher of task.watchersDetails) {
      const templateData = {
        user: { firstName: watcher.firstName, lastName: watcher.lastName },
        task,
        project,
        appUrl: environment.APP_URL
      };

      sendEmailArrays.push({
        to: [watcher.emailId],
        subject: EmailSubjectEnum.taskUpdated,
        message: await this._emailService.getTemplate(EmailTemplatePathEnum.taskUpdated, templateData)
      });
    }

    sendEmailArrays.forEach(email => {
      this._emailService.sendMail(email.to, email.subject, email.message);
    });
  }

  /**
   * prepare filter query for task filtering
   * @param model : TaskFilterModel
   */
  public prepareFilterQuery(model: TaskFilterModel) {

    // set search filed in query
    // name, displayName, description and tags
    const filter: any = {
      $and: [{
        projectId: toObjectId(model.projectId)
      }, {
        $or: [{
          name: { $regex: new RegExp(model.query.toString()), $options: 'i' }
        },
          {
            displayName: { $regex: new RegExp(model.query.toString()), $options: 'i' }
          },
          {
            description: { $regex: new RegExp(model.query.toString()), $options: 'gi' }
          },
          {
            tags: { $regex: new RegExp(model.query.toString()), $options: 'i' }
          }]
      }]
    };

    // check if advance queries are applied
    if (model.queries && model.queries.length) {
      model.queries.forEach(query => {
        // and condition
        if (query.condition === TaskFilterCondition.and) {
          filter.$and.push(
            { [query.key]: { $in: query.value } }
          );
        } else {
          // or condition
          filter.$and.push({
            $or: [{ [query.key]: { $in: query.value } }]
          });
        }
      });
    }

    return filter;
  }
}

