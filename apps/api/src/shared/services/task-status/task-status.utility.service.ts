import { TaskStatusModel } from '../../../../../../libs/models/src/lib/models/task-status.model';
import { BadRequest } from '../../helpers/helpers';

export class TaskStatusUtilityService {
  constructor() {
  }

  addUpdateValidityChecker(status: TaskStatusModel) {
    if (!status.name) {
      BadRequest('Status name is required');
    }
  }
}
