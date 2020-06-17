import {
  BoardColumns,
  BoardModel,
  EmailSubjectEnum,
  EmailTemplatePathEnum,
  Project,
  Sprint, SprintActionEnum,
  SprintColumn, SprintColumnTask,
  SprintErrorEnum, SprintMembersCapacity,
  Task,
  UpdateSprintMemberWorkingCapacity,
  User
} from '@aavantan-app/models';
import * as moment from 'moment';
import {
  BadRequest,
  generateUtcDate, hourToSeconds,
  secondsToHours,
  secondsToString,
  validWorkingDaysChecker
} from '../../helpers/helpers';
import { DEFAULT_DATE_FORMAT, DEFAULT_DECIMAL_PLACES } from '../../helpers/defaultValueConstant';
import { EmailService } from '../email.service';
import { orderBy } from 'lodash';
import { BoardUtilityService } from '../board/board.utility.service';

export class SprintUtilityService {
  private _boardUtilityService: BoardUtilityService;
  private _emailService: EmailService;

  constructor() {
    this._boardUtilityService = new BoardUtilityService();
    this._emailService = new EmailService();
  }

  /**
   * common sprint related validations
   * check name, started At, end At, goal present or not
   * check sprint start date is not before today
   * check sprint end date is not before start date
   * @param sprint
   */
  commonSprintValidator(sprint: Sprint) {
    // check if sprint is available or not
    if (!sprint) {
      BadRequest('Invalid request sprint details missing');
    }

    // sprint name
    if (!sprint.name) {
      BadRequest('Sprint Name is compulsory');
    }

    // sprint goal
    if (!sprint.goal) {
      BadRequest('Sprint goal is required');
    }

    // sprint started at
    if (!sprint.startedAt) {
      BadRequest('Please select Sprint Start Date');
    }

    // sprint end at
    if (!sprint.endAt) {
      BadRequest('Please select Sprint End Date');
    }

    // started date can not be before today
    const isStartDateBeforeToday = moment(sprint.startedAt).isBefore(moment().startOf('d'));
    if (isStartDateBeforeToday) {
      BadRequest('Sprint Started date can not be Before Today');
    }

    // end date can not be before start date
    const isEndDateBeforeTaskStartDate = moment(sprint.endAt).isBefore(sprint.startedAt);
    if (isEndDateBeforeTaskStartDate) {
      BadRequest('Sprint End Date can not be before Sprint Start Date');
    }
  }

  /**
   * check whether task is valid or not to add in sprint or move in a stage
   * @param task
   * @param isMoveTaskProcess
   */
  checkTaskIsAllowedToAddInSprint(task: Task, isMoveTaskProcess: boolean = false) {
    // check if task found
    if (task) {
      // check task assignee
      if (!task.assigneeId) {
        BadRequest(SprintErrorEnum.taskNoAssignee);
      }

      // check task estimation
      if (!task.estimatedTime) {
        BadRequest(SprintErrorEnum.taskNoEstimate);
      }

      // check if task is already in sprint
      if (!isMoveTaskProcess && task.sprintId) {
        BadRequest(SprintErrorEnum.alreadyInSprint);
      }
    } else {
      // if task not found return error
      BadRequest(SprintErrorEnum.taskNotFound);
    }
  }

  /**
   * create a sprint member from project members array
   * @param {Project} project
   * @param {string} memberId
   * @return {SprintMembersCapacity}
   */
  createSprintMember(project: Project, memberId: string): SprintMembersCapacity {
    const member = project.members.find(projectMember => projectMember.userId.toString() === memberId.toString());

    return {
      userId: memberId,
      workingCapacity: hourToSeconds(member.workingCapacity),
      workingCapacityPerDay: hourToSeconds(member.workingCapacityPerDay),
      workingDays: member.workingDays
    };
  }

  /**
   * add task to column
   * adds a task to a column by task status
   * if task is deleted than it will re add task to sprint by setting removedAt to null
   * @param project
   * @param sprint
   * @param task
   * @param addedById
   */
  addTaskToColumn(project: Project, sprint: Sprint, task: Task, addedById: string) {
    // get column index where we can add this task in sprint column from active board details
    const columnIndex = this._boardUtilityService.getColumnIndexFromStatus(project.activeBoard, task.statusId.toString());
    if (columnIndex === -1) {
      BadRequest('Column not found');
    }

    // check if task is deleted or not
    const isDeletedTaskIndex = sprint.columns[columnIndex].tasks.findIndex(innerTask => innerTask.taskId.toString() === task.id);

    // add task estimation to sprint total estimation
    sprint.totalEstimation += task.estimatedTime;

    // add task estimation to column total estimation
    sprint.columns[columnIndex].totalEstimation += task.estimatedTime;

    // if task is not deleted earlier then add new task to column
    if (isDeletedTaskIndex === -1) {
      // add task to column
      sprint.columns[columnIndex].tasks.push({
        taskId: task.id,
        addedAt: generateUtcDate(),
        addedById: addedById,
        totalLoggedTime: 0
      });
    } else {
      // if task is deleted than set removedById to null and removedAt to null
      sprint.columns[columnIndex].tasks[isDeletedTaskIndex] = {
        taskId: sprint.columns[columnIndex].tasks[isDeletedTaskIndex].taskId,
        totalLoggedTime: sprint.columns[columnIndex].tasks[isDeletedTaskIndex].totalLoggedTime,
        removedById: null,
        removedAt: null,
        addedAt: generateUtcDate(),
        addedById: addedById
      };
    }

    // set total remaining capacity by subtracting sprint members totalCapacity - totalEstimation
    sprint.totalRemainingCapacity = sprint.totalCapacity - sprint.totalEstimation;
    sprint.totalRemainingTime = sprint.totalEstimation - sprint.totalLoggedTime;

  }

  /**
   * convert sprint object to it's view model
   * @param sprint
   * @returns {Sprint}
   */
  prepareSprintVm(sprint: Sprint): Sprint {
    if (!sprint) {
      return sprint;
    }
    sprint.id = sprint['_id'];

    // calculate sprint totals
    this.calculateSprintEstimates(sprint);

    // loop over columns and filter out hidden columns and
    // convert total estimation time to readable format
    if (sprint.columns) {

      // filter out hidden columns
      sprint.columns = sprint.columns.filter(column => !column.isHidden).map(column => {
        column.tasks = column.tasks.filter(task => !task.removedById);
        column.tasks = column.tasks.map(task => {
          task.task = this.parseTaskObjectVm(task.task);
          task.totalLoggedTimeReadable = secondsToString(task.totalLoggedTime);
          return task;
        });
        return column;
      });

      // calculate total estimates
      this.calculateTotalEstimateForColumns(sprint);

      // loop over sprint columns
      sprint.columns.forEach(column => {
        column.totalEstimationReadable = secondsToString(column.totalEstimation);
      });
    }

    // loop over sprint members and convert working capacity to readable format
    if (sprint.membersCapacity) {
      sprint.membersCapacity.forEach(member => {
        member.user.id = member.user._id.toString();
        // convert capacity to hours again
        member.workingCapacity = secondsToHours(member.workingCapacity);
        member.workingCapacityPerDay = secondsToHours(member.workingCapacityPerDay);
      });
    }

    return sprint;
  }

  /**
   * parse task object, convert seconds to readable string, fill task type, priority, status etc..
   * @param task : Task
   */
  parseTaskObjectVm(task: Task) {
    task.id = task['_id'];

    task.isSelected = !!task.sprintId;

    // convert all time keys to string from seconds
    task.totalLoggedTimeReadable = secondsToString(task.totalLoggedTime || 0);
    task.estimatedTimeReadable = secondsToString(task.estimatedTime || 0);
    task.remainingTimeReadable = secondsToString(task.remainingTime || 0);
    task.overLoggedTimeReadable = secondsToString(task.overLoggedTime || 0);
    task.taskAge = moment().utc().diff(moment(task.createdAt), 'd');

    if (task.attachmentsDetails) {
      task.attachmentsDetails.forEach(attachment => {
        attachment.id = attachment['_id'];
      });
    }
    return task;
  }

  /**
   * publish sprint validation
   * check validations before publishing the sprint
   * check start date is not in past
   * end date is not before start date
   * check if sprint has any task or not
   * @param sprintDetails
   */
  publishSprintValidations(sprintDetails: Sprint) {
    // validation
    const sprintStartDate = moment(sprintDetails.startedAt);
    const sprintEndDate = moment(sprintDetails.endAt);

    // sprint start date is before today
    if (sprintStartDate.isBefore(moment(), 'd')) {
      BadRequest('Sprint start date is before today!');
    }

    // sprint end date can not be before today
    if (sprintEndDate.isBefore(moment(), 'd')) {
      BadRequest('Sprint end date is passed!');
    }

    // check if sprint has any tasks or not
    const checkIfThereAnyTasks = sprintDetails.columns.some(stage => {
      return !!stage.tasks.length;
    });

    if (!checkIfThereAnyTasks) {
      BadRequest('No task found, Please add at least one task to publish the sprint');
    }

    // commented out capacity check for now
    // if (sprintDetails.totalEstimation > sprintDetails.totalCapacity) {
    //   BadRequest('Sprint estimation is higher than the sprint capacity!');
    // }
  }

  /**
   * send sprint emails
   * @param sprintDetails
   * @param type
   */
  async sendSprintEmails(sprintDetails: Sprint, type: EmailSubjectEnum = EmailSubjectEnum.sprintPublished) {
    // prepare sprint email templates
    const sprintEmailArray = [];

    for (let i = 0; i < sprintDetails.membersCapacity.length; i++) {
      const member = sprintDetails.membersCapacity[i];
      sprintEmailArray.push({
        to: member.user.emailId,
        subject: type,
        message: type === EmailSubjectEnum.sprintPublished ?
          await this.prepareSprintPublishEmailTemplate(sprintDetails, member.user, member.workingCapacity) :
          await this.prepareSprintClosedEmailTemplate(sprintDetails, member.user)
      });
    }

    // send mail to all the sprint members
    sprintEmailArray.forEach(email => {
      this._emailService.sendMail([email.to], email.subject, email.message);
    });
  }

  /**
   * prepare publish sprint template for sending mail when sprint is published
   * @param sprint
   * @param user
   * @param workingCapacity
   */
  private prepareSprintPublishEmailTemplate(sprint: Sprint, user: User, workingCapacity: number): Promise<string> {
    const templateData = {
      user,
      sprint: {
        name: sprint.name,
        startedAt: moment(sprint.startedAt).format(DEFAULT_DATE_FORMAT),
        endAt: moment(sprint.endAt).format(DEFAULT_DATE_FORMAT),
        workingCapacity: secondsToString(workingCapacity)
      }
    };
    return this._emailService.getTemplate(EmailTemplatePathEnum.publishSprint, templateData);
  }

  /**
   * prepare close sprint template for sending mail when sprint is closed
   * @param sprint
   * @param user
   */
  private prepareSprintClosedEmailTemplate(sprint: Sprint, user: User): Promise<string> {
    const templateData = {
      user,
      sprint
    };
    return this._emailService.getTemplate(EmailTemplatePathEnum.closeSprint, templateData);
  }

  /**
   * get column index from column id
   * @param sprint
   * @param columnId
   */
  getColumnIndexFromColumn(sprint: Sprint, columnId: string) {
    return sprint.columns.findIndex(column => {
      return column.id.toString() === columnId.toString();
    });
  }

  /**
   * calculate sprint estimates
   * and convert seconds to readable format
   * @param sprint
   */
  calculateSprintEstimates(sprint: Sprint) {
    // count how many days left for sprint completion
    sprint.sprintDaysLeft = moment(sprint.endAt).diff(moment().utc(), 'd');

    // convert total capacity in readable format
    sprint.totalCapacityReadable = secondsToString(sprint.totalCapacity);

    // convert estimation time in readable format
    sprint.totalEstimationReadable = secondsToString(sprint.totalEstimation);

    // calculate total remaining capacity
    sprint.totalRemainingCapacity = sprint.totalCapacity - sprint.totalEstimation || 0;
    sprint.totalRemainingCapacityReadable = secondsToString(sprint.totalRemainingCapacity);

    // convert total logged time in readable format
    sprint.totalLoggedTimeReadable = secondsToString(sprint.totalLoggedTime);

    // convert total over logged time in readable format
    sprint.totalOverLoggedTimeReadable = secondsToString(sprint.totalOverLoggedTime || 0);

    // calculate progress
    sprint.progress = Number(((100 * sprint.totalLoggedTime) / sprint.totalEstimation).toFixed(DEFAULT_DECIMAL_PLACES)) || 0;
    if (sprint.progress > 100) {
      sprint.progress = 100;

      // set total remaining time to zero
      sprint.totalRemainingTime = 0;
      sprint.totalRemainingTimeReadable = secondsToString(sprint.totalRemainingTime);
    } else {
      // calculate total remaining time
      sprint.totalRemainingTime = sprint.totalEstimation - sprint.totalLoggedTime || 0;
      sprint.totalRemainingTimeReadable = secondsToString(sprint.totalRemainingTime);
    }

    // calculate over progress
    sprint.overProgress = Number(((100 * sprint.totalOverLoggedTime) / sprint.totalEstimation).toFixed(DEFAULT_DECIMAL_PLACES)) || 0;

    // convert seconds to hours for displaying on ui
    // sprint.totalCapacity = secondsToHours(sprint.totalCapacity);
    // sprint.totalEstimation = secondsToHours(sprint.totalEstimation);
    // sprint.totalRemainingCapacity = secondsToHours(sprint.totalRemainingCapacity);
    // sprint.totalLoggedTime = secondsToHours(sprint.totalLoggedTime);
    // sprint.totalOverLoggedTime = secondsToHours(sprint.totalOverLoggedTime || 0);
    // sprint.totalRemainingTime = secondsToHours(sprint.totalRemainingTime);

    // calculate sprint columns estimates
    if (sprint.columns) {
      this.calculateTotalEstimateForColumns(sprint);
    }
  }

  /**
   * calculate total estimate for all the sprint columns
   */
  calculateTotalEstimateForColumns(sprint: Sprint) {
    return sprint.columns.map(column => {
      column.totalEstimation = column.tasks.reduce((previousValue, currentValue) => {
        return previousValue + (currentValue.task ? currentValue.task.estimatedTime : 0);
      }, 0);
    });
  }

  /**
   * move task to new column
   * moves a task from current column to new column
   * @param sprintDetails
   * @param taskDetail
   * @param oldSprintTask
   * @param addedById
   * @param currentColumnIndex
   * @param newColumnIndex
   */
  moveTaskToNewColumn(sprintDetails: Sprint, taskDetail: Task, oldSprintTask: SprintColumnTask,
                      addedById: string, currentColumnIndex: number, newColumnIndex: number): SprintColumn[] {
    return sprintDetails.columns.map((column, index) => {
      // remove from current column and minus estimation time from total column estimation time
      if (index === currentColumnIndex) {
        column.totalEstimation -= taskDetail.estimatedTime;
        column.tasks = column.tasks.filter(task => task.taskId.toString() !== taskDetail.id.toString());
      }

      // add task to new column and also add task estimation to column total estimation
      if (index === newColumnIndex) {
        column.totalEstimation += taskDetail.estimatedTime;
        column.tasks.push({
          taskId: taskDetail.id,
          addedAt: generateUtcDate(),
          addedById: addedById,
          description: SprintActionEnum.taskMovedToColumn,
          totalLoggedTime: oldSprintTask.totalLoggedTime
        });
      }

      return column;
    });
  }

  /**
   * re order sprint columns with board columns
   */
  reOrderSprintColumns(board: BoardModel, sprint: Sprint) {
    const sprintColumns = [];
    board.columns = orderBy(board.columns, 'columnOrderNo', 'asc');

    board.columns.forEach((column, index) => {
      const sprintColumnIndex = this.getColumnIndexFromColumn(sprint, column.headerStatusId);
      sprintColumns.splice(index, 0, sprint.columns[sprintColumnIndex]);
    });

    return sprintColumns;
  }

  /**
   *
   * @param sprint
   * @param taskId
   */
  getColumnIndexFromTask(sprint: Sprint, taskId: string = ''): number {
    return sprint.columns.findIndex(column => {
      return column.tasks.some(task => task.taskId.toString() === taskId.toString());
    });
  }

  /**
   * get task index from current sprint column
   * @param sprint
   * @param columnIndex
   * @param taskId
   */
  getTaskIndexFromColumn(sprint: Sprint, columnIndex: number, taskId: string) {
    return sprint.columns[columnIndex].tasks.findIndex(task => task.taskId.toString() === taskId.toString());
  }

  /**
   * reassign sprint when a board get's updated
   * @param activeBoard
   * @param activeSprint
   */
  reassignSprintColumns(activeBoard: BoardModel, activeSprint: Sprint) {

    // check if there are any changes in board
    activeSprint.columns.forEach(column => {
      const columnIndexInBoard = this._boardUtilityService.getColumnIndex(activeBoard.columns, column.id);

      // column found then update it's is hidden and all other things
      if (columnIndexInBoard > -1) {
        column.isHidden = activeBoard.columns[columnIndexInBoard].isHidden;
      } else {

        /** if column not found then there should be some scenarios we have to check
         * 1. column merged to a another column as a status
         * **/
          // 1. column merged to another column so column itself become a status
        const columnIndexFromStatusesOfBoard = this._boardUtilityService.getColumnIndexFromStatus(activeBoard, column.id);

        if (columnIndexFromStatusesOfBoard > -1) {
          // find the new column id where the current column merged as status
          const newColumnId = activeBoard.columns[columnIndexFromStatusesOfBoard].headerStatusId;

          // now column found as a status so we need to move all the task of this column to the column we found in the sprint
          // so first we need to find if found column is in sprint or not and if yes than move this columns tasks to that column task
          const columnIndexInSprint = this.getColumnIndexFromColumn(activeSprint, newColumnId);

          if (columnIndexInSprint > -1) {
            // now we found column in sprint than move all task from current column to this column
            activeSprint.columns[columnIndexInSprint].tasks.push(...column.tasks);

            // set this column as hidden because it's got merged on another column
            column.isHidden = true;
            column.tasks = [];
            column.totalEstimation = 0;
            column.totalEstimationReadable = '';
          }
        }
      }
    });

    const newColumns = activeBoard.columns.filter(column => {
      return !activeSprint.columns.some(sprintColumn => sprintColumn.id.toString() === column.headerStatusId.toString());
    });

    if (newColumns.length) {

      // create new columns in sprint
      newColumns.forEach(nColumn => {
        const allTasksWithThisStatus = [];

        // loop over all the tasks and get the tasks which status is equal to new column status
        // assign matched tasks to the new column tasks
        activeSprint.columns.forEach(column => {
          column.tasks.forEach((columnTask, index) => {
            if (columnTask.task.statusId.toString() === nColumn.headerStatusId.toString()) {
              allTasksWithThisStatus.push(columnTask);
              column.tasks.splice(index, 1);
            }
          });
        });

        // create new column
        const sprintColumn = new SprintColumn();
        sprintColumn.id = nColumn.headerStatusId;
        sprintColumn.statusId = nColumn.headerStatusId;
        sprintColumn.name = nColumn.headerStatus.name;
        sprintColumn.tasks = allTasksWithThisStatus;
        sprintColumn.totalEstimation = 0;
        sprintColumn.isHidden = false;

        // add new column to sprint columns
        activeSprint.columns.push(sprintColumn);
      });
    }

    // calculate total estimation for all the sprint columns
    this.calculateTotalEstimateForColumns(activeSprint);
    activeSprint.columns = this.reOrderSprintColumns(activeBoard, activeSprint);

    return activeSprint;
  }

  /**
   * update sprint member capacity validations
   * @param model
   * @param project
   */
  updateMemberCapacityValidations(model: UpdateSprintMemberWorkingCapacity, project: Project) {

    // check capacity object is present or not
    if (!model.capacity || !model.capacity.length) {
      BadRequest('please add at least one member capacity');
    }

    // check if all members are part of the project
    const everyMemberThere = model.capacity.every(member => project.members.some(proejctMember => {
      return proejctMember.userId === member.memberId && proejctMember.isInviteAccepted;
    }));
    if (!everyMemberThere) {
      BadRequest('One of member is not found in Project!');
    }

    // valid working days
    const validWorkingDays = model.capacity.every(ddt => validWorkingDaysChecker(ddt.workingDays));

    if (!validWorkingDays) {
      BadRequest('One of Collaborator working days are invalid');
    }
  }

  /**
   * get last column from sprint column
   * filter out hidden columns
   * @param sprintColumns
   */
  getLastColumnFromSprint(sprintColumns: SprintColumn[]): SprintColumn {
    return sprintColumns.reverse().find(column => !column.isHidden);
  }
}
