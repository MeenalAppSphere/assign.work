import { TaskPriorityModel } from '@aavantan-app/models';
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
}
