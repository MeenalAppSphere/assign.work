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
import { BadRequest, generateUtcDate, secondsToString, stringToSeconds, toObjectId } from '../../helpers/helpers';
import { DEFAULT_DECIMAL_PLACES } from '../../helpers/defaultValueConstant';
import * as moment from 'moment';

/**
 * task schema keys mapper for filter query
 */
const taskSchemaKeysMapper = new Map<string, string>([
  ['sprintId', 'sprintId'],
  ['createdBy', 'createdById'],
  ['createdById', 'createdById'],
  ['assignee', 'assigneeId'],
  ['assigneeId', 'assigneeId'],
  ['taskType', 'taskTypeId'],
  ['taskTypeId', 'taskTypeId'],
  ['priority', 'priorityId'],
  ['priorityId', 'priorityId'],
  ['status', 'statusId'],
  ['statusId', 'statusId']
]);

/**
 * task sorting keys mapper for sorting filter query
 */
const taskSortingKeysMapper = new Map<string, string>([
  ['name', 'name'],
  ['createdBy', 'createdBy.firstName'],
  ['createdById', 'createdBy.firstName'],
  ['assignee', 'assignee.firstName'],
  ['assigneeId', 'assignee.firstName'],
  ['taskType', 'taskType.name'],
  ['taskTypeId', 'taskType.name'],
  ['priority', 'priority.name'],
  ['priorityId', 'priority.name'],
  ['status', 'status.name'],
  ['statusId', 'status.name'],
  ['createdAt', 'createdAt'],
  ['updateAt', 'updateAt'],
  ['estimatedTime', 'estimatedTime'],
  ['totalLoggedTime', 'totalLoggedTime'],
  ['progress', 'progress'],
  ['overProgress', 'overProgress']
]);

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
    taskModel.description = model.description || '';
    taskModel.tags = model.tags;
    taskModel.attachments = model.attachments || [];

    taskModel.taskTypeId = model.taskTypeId;
    taskModel.completionDate = model.completionDate || generateUtcDate();

    // if no task priority found than assign project's default priority id
    taskModel.priorityId = model.priorityId || project.settings.defaultTaskPriorityId;

    // if no status found than assign project's default status
    taskModel.statusId = model.statusId || project.settings.defaultTaskStatusId;

    taskModel.sprintId = null;

    taskModel.dependentItemId = model.dependentItemId;
    taskModel.relatedItemId = model.relatedItemId || [];
    taskModel.assigneeId = model.assigneeId;

    taskModel.estimatedTime = model.estimatedTimeReadable ? stringToSeconds(model.estimatedTimeReadable) : 0;
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
  async sendMailForTaskAssigned(task: Task, project: Project) {
    // send task assignee email
    const taskAssigneeEmailTemplateData = {
      task,
      project,
      appUrl: environment.APP_URL
    };

    const subject = EmailSubjectEnum.taskAssigned.replace(':displayName', task.displayName);

    const taskAssigneeEmailObject: SendEmailModel = {
      to: [task.assignee.emailId],
      subject: subject as EmailSubjectEnum,
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


      const subject = EmailSubjectEnum.taskUpdated.replace(':userName', task.updatedBy.firstName + ' ' + task.updatedBy.lastName)
        .replace(':displayName', task.displayName);

      sendEmailArrays.push({
        to: [watcher.emailId],
        subject: subject as EmailSubjectEnum,
        message: await this._emailService.getTemplate(EmailTemplatePathEnum.taskUpdated, templateData)
      });
    }

    sendEmailArrays.forEach(email => {
      this._emailService.sendMail(email.to, email.subject, email.message);
    });
  }

  /**
   * parse task object, convert seconds to readable string, fill task type, priority, status etc..
   * @param task : Task
   */
  prepareTaskVm(task: Task) {
    task.id = task['_id'];

    if (task.assignee) {
      task.assignee.id = task.assignee._id;
    }

    if (task.createdBy) {
      task.createdBy.id = task.createdBy._id;
    }

    if (task.updatedBy) {
      task.updatedBy.id = task.updatedBy._id;
    }

    if (task.taskType) {
      task.taskType.id = task.taskType._id;
      if (task.taskType.assignee) {
        task.taskType.assignee.id = task.taskType.assignee._id;
      }
    }

    if (task.status) {
      task.status.id = task.status._id;
    }

    if (task.priority) {
      task.priority.id = task.priority._id;
    }

    task.isSelected = !!task.sprintId;

    // convert all time keys to string from seconds
    task.totalLoggedTimeReadable = secondsToString(task.totalLoggedTime || 0);
    task.estimatedTimeReadable = secondsToString(task.estimatedTime || 0);
    task.remainingTimeReadable = secondsToString(task.remainingTime || 0);
    task.overLoggedTimeReadable = secondsToString(task.overLoggedTime || 0);
    task.taskAge = moment().utc().diff(moment(task.createdAt, 'YYYY-MM-DD'), 'd');

    if (task.attachmentsDetails) {
      task.attachmentsDetails.forEach(attachment => {
        attachment.id = attachment['_id'];
      });
    }
    return task;
  }

  /**
   * calculate task progress and over progress
   * @param task
   * @param loggedTime
   * @param estimatedTime
   */
  calculateTaskProgress(task: Task, loggedTime: number, estimatedTime: number) {
    // calculate progress and over progress
    const progress: number = Number(((100 * loggedTime) / estimatedTime).toFixed(DEFAULT_DECIMAL_PLACES));

    // if process is grater 100 then over time is added
    // in this case calculate overtime and set remaining time to 0
    if (progress > 100) {
      task.progress = 100;
      task.remainingTime = 0;
      task.overLoggedTime = loggedTime - estimatedTime;

      const overProgress = Number(((100 * task.overLoggedTime) / estimatedTime).toFixed(DEFAULT_DECIMAL_PLACES));
      task.overProgress = overProgress > 100 ? 100 : overProgress;
    } else {
      // normal time logged
      // set overtime 0 and calculate remaining time
      task.progress = progress;
      task.remainingTime = estimatedTime - task.totalLoggedTime;
      task.overLoggedTime = 0;
      task.overProgress = 0;
    }
  }

  /**
   * prepare filter query for task filtering
   * 1. main stage like matching projectId
   * 2. search stage for searching on specific fields
   * 3. additional or queries
   * @param model : TaskFilterModel
   */
  prepareFilterQuery(model: TaskFilterModel) {

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
        query.key = this.validTaskQueryKey(query.key);

        if (query.value.length) {

          // convert value to object id
          query.value = query.value.map(value => {
            if (value) {
              // convert to object id because mongo aggregate requires object id for matching foreign documents
              value = toObjectId(value);
            }
            return value;
          });

          query.reverseFilter = false;
        } else {
          query.reverseFilter = true;
        }


        // and condition
        // add directly to the filter.$add
        if (query.condition === TaskFilterCondition.and) {
          // check if reverse filter is set than use $nin => not in query
          // else use $in => in query
          filter.$and.push(
            { [query.key]: { [!query.reverseFilter ? '$in' : '$nin']: query.value } }
          );
        }
      });

      // check if we have any query with or condition
      const isAnyOrConditionQuery = model.queries.some(query => query.condition === TaskFilterCondition.or);
      if (isAnyOrConditionQuery) {
        // push a $or stage in $and so all the advance query will be executed in last stage of filter
        filter.$and.push({
          $or: []
        });

        model.queries.forEach(query => {
          query.key = this.validTaskQueryKey(query.key);

          if (query.value.length) {
            // convert value to object id
            query.value = query.value.map(value => {
              if (value) {
                // convert to object id because mongo aggregate requires object id for matching foreign documents
                value = toObjectId(value);
              }
              return value;
            });
            query.reverseFilter = false;
          } else {
            query.reverseFilter = true;
          }


          if (query.condition === TaskFilterCondition.or) {
            // or condition
            // find last $or stage in filter and add query to last $or stage
            // because this is advance query and it will be executed at last

            // check if reverse filter is set than use $nin => not in query
            // else use $in => in query
            filter.$and[filter.$and.length - 1].$or.push({
              [query.key]: { [!query.reverseFilter ? '$in' : '$nin']: query.value }
            });
          }
        });
      }
    }

    return filter;
  }

  /**
   * check valid tasks query or not
   * @param key
   */
  validTaskQueryKey(key) {
    if (taskSchemaKeysMapper.has(key)) {
      return taskSchemaKeysMapper.get(key);
    } else {
      BadRequest('Invalid query request');
    }
  }

  /**
   * check valida sorting key or not
   * @param key
   */
  validTaskSortingKey(key) {
    if (taskSortingKeysMapper.has(key)) {
      return taskSortingKeysMapper.get(key);
    } else {
      BadRequest('Invalid sort by request');
    }
  }
}

