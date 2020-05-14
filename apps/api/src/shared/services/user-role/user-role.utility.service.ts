import { Project, UserRoleModel } from '@aavantan-app/models';
import { BadRequest, isValidString, maxLengthValidator } from '../../helpers/helpers';

export class UserRoleUtilityService {
  constructor() {
  }

  /**
   * check common validation for creating/ updating user role
   * @param userRole
   */
  public userRoleValidations(userRole: UserRoleModel) {
    if (!userRole || !userRole.name) {
      BadRequest('Please add Role name');
    }

    // name validation
    if (!isValidString(userRole.name, true)) {
      BadRequest('No special characters allowed in name');
    }

    // max length validator
    if (!maxLengthValidator(userRole.name, 30)) {
      BadRequest('Maximum 30 characters allowed in Role name');
    }

  }

  public prepareDefaultTaskPriorities(userRoles: UserRoleModel[], project: Project): UserRoleModel[] {
    return userRoles.map(userRole => {
      userRole.projectId = project._id;
      userRole.createdById = project.createdById;
      userRole.description = `${userRole.name} is a default user Role which is provided when you create a new Project`;
      return userRole;
    });
  }
}
