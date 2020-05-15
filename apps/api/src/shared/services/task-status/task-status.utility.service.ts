import { Project, TaskStatusModel } from '@aavantan-app/models';
import { BadRequest, isValidString, maxLengthValidator } from '../../helpers/helpers';
import { DEFAULT_TASK_STATUSES } from '../../helpers/defaultValueConstant';

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
    if (!isValidString(status.name, true)) {
      BadRequest('No Special characters allowed in status name');
    }

    // max length validator
    if (!maxLengthValidator(status.name, 50)) {
      BadRequest('Maximum 10 characters allowed in Task Status name');
    }

    // color validation
    if (!status.color) {
      BadRequest('Please choose color');
    }
  }

  /**
   * prepare default statues model for new project
   * @param project
   */
  public prepareDefaultStatuses(project: Project): TaskStatusModel[] {
    const statuses: TaskStatusModel[] = [];
    DEFAULT_TASK_STATUSES.forEach(defaultStatus => {
      const status = new TaskStatusModel();
      status.name = defaultStatus.name;
      status.color = defaultStatus.color;
      status.isDefault = defaultStatus.isDefault;
      status.projectId = project.id;
      status.createdById = project.createdById;
      status.description = `${status.name} is a default status which is provided with new Project`;

      statuses.push(status);
    });

    return statuses;
  }
}
