import { Project, TaskPriorityModel, TaskTypeModel } from '@aavantan-app/models';
import { BadRequest, isValidString, maxLengthValidator } from '../../helpers/helpers';

export class TaskPriorityUtilityService {
  constructor() {
  }

  /**
   * check common validation for creating/ updating task priority
   * @param taskPriority
   */
  public taskPriorityValidations(taskPriority: TaskPriorityModel) {
    if (!taskPriority || !taskPriority.name) {
      BadRequest('Please add Task Priority name');
    }

    // name validation
    if (!isValidString(taskPriority.name)) {
      BadRequest('No special characters allowed in name');
    }

    // max length validator
    if (!maxLengthValidator(taskPriority.name, 10)) {
      BadRequest('Maximum 10 characters allowed in Task Priority name');
    }

    // color validation
    if (!taskPriority.color) {
      BadRequest('Please choose color');
    }
  }

  public prepareDefaultTaskPriorities(taskPriorities: TaskPriorityModel[], project: Project): TaskPriorityModel[] {
    return taskPriorities.map(taskPriority => {
      taskPriority.projectId = project._id;
      taskPriority.createdById = project.createdById;
      taskPriority.description = `${taskPriority.name} is a default task Priority which is provided when you create a new Project`;
      return taskPriority;
    });
  }
}
