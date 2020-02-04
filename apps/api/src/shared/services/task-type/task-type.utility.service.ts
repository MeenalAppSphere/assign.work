import { TaskType } from '@aavantan-app/models';
import { BadRequest, isValidString } from '../../helpers/helpers';

export class TaskTypeUtilityService {
  constructor() {
  }

  /**
   * check common validation for creating/ updating task type
   * @param taskType
   */
  public taskTypeValidations(taskType: TaskType) {
    if (!taskType || !taskType.name) {
      BadRequest('Please add Task Type name');
    }

    // name validation
    if (!isValidString(taskType.name)) {
      BadRequest('No special characters allowed in name');
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
  }
}
