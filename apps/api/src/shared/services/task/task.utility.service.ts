import { EmailSubjectEnum, EmailTemplatePathEnum, Project, Task } from '@aavantan-app/models';
import { BoardUtilityService } from '../board/board.utility.service';
import { EmailService } from '../email.service';
import { environment } from '../../../environments/environment';

export class TaskUtilityService {
  private _boardUtilityService: BoardUtilityService;
  private _emailService: EmailService;

  constructor() {
    this._boardUtilityService = new BoardUtilityService();
    this._emailService = new EmailService();
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

    taskModel.sprint = null;

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

  async sendMailToTaskAssignee(task: Task, project: Project) {
    const templateData = {
      task,
      project,
      appUrl: environment.APP_URL
    };

    const emailObject = {
      to: task.assignee.emailId,
      subject: EmailSubjectEnum.taskAssigned,
      message: await this._emailService.getTemplate(EmailTemplatePathEnum.taskAssigned, templateData)
    };

    this._emailService.sendMail([emailObject.to], emailObject.subject, emailObject.message);
  }
}
