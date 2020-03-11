import { TaskPriorityModel } from '@aavantan-app/models';
import { BadRequest, isValidString } from '../../helpers/helpers';

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

    // color validation
    if (!taskPriority.color) {
      BadRequest('Please choose color');
    }
  }
}
