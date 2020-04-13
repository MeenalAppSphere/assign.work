import { Project, ProjectDefaultStatusEnum, TaskStatusModel } from '@aavantan-app/models';
import { BadRequest, isValidString, maxLengthValidator } from '../../helpers/helpers';

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
  }

  public prepareDefaultStatuses(project: Project): TaskStatusModel[] {
    const statuses: TaskStatusModel[] = [];
    Object.keys(ProjectDefaultStatusEnum).forEach(statusKey => {
      const status = new TaskStatusModel();
      status.name = ProjectDefaultStatusEnum[statusKey];
      status.isDefault = true;
      status.projectId = project.id;
      status.createdById = project.createdById;
      status.description = `${status.name} is a default status which is provided when you create a new Project`;

      statuses.push(status);
    });

    return statuses;
  }
}
