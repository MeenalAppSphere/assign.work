import { Project, TaskTypeModel } from '@aavantan-app/models';
import { BadRequest, isValidString, maxLengthValidator } from '../../helpers/helpers';

export class TaskTypeUtilityService {
  constructor() {
  }

  /**
   * check common validation for creating/ updating task type
   * @param taskType
   */
  public taskTypeValidations(taskType: TaskTypeModel) {
    if (!taskType || !taskType.name) {
      BadRequest('Please add Task Type name');
    }

    // name validation
    if (!isValidString(taskType.name)) {
      BadRequest('No special characters allowed in name');
    }

    // max length validator
    if (!maxLengthValidator(taskType.name, 10)) {
      BadRequest('Maximum 10 characters allowed in Task type name');
    }

    // display name validation
    if (!taskType.displayName) {
      BadRequest('Please add Task Type display name');
    }

    // valid display name
    if (!isValidString(taskType.displayName)) {
      BadRequest('No special characters allowed in display name');
    }

    // color validation
    if (!taskType.color) {
      BadRequest('Please choose color');
    }

    // assignee id validations
    if (!taskType.assigneeId) {
      BadRequest('Please select Assignee Name');
    }
  }

  public prepareDefaultTaskTypes(taskTypes: TaskTypeModel[], project: Project): TaskTypeModel[] {
    return taskTypes.map(taskType => {
      taskType.projectId = project._id;
      taskType.createdById = project.createdById;
      taskType.description = `${taskType.name} is a default task type which is provided when you create a new Project`;
      return taskType;
    });
  }
}
