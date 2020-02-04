import { TaskStatusModel } from '../../../../../../libs/models/src/lib/models/task-status.model';
import { BadRequest, isValidString } from '../../helpers/helpers';

export class TaskStatusUtilityService {
  constructor() {
  }

  /**
   * add update normal validations checker
   * @param status
   */
  statusValidations(status: TaskStatusModel) {
    // status name available or not
    if (!status.name) {
      BadRequest('Status name is required');
    }

    // is status name has valid string
    if (!isValidString(status.name)) {
      BadRequest('No Special characters allowed in status name');
    }
  }
}
