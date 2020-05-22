import { Project, UserRoleModel } from '@aavantan-app/models';
import { BadRequest, isValidString, maxLengthValidator } from '../../helpers/helpers';
import { DEFAULT_USER_ROLES } from '../../helpers/defaultValueConstant';
import { PERMISSIONS } from '../../../../../../libs/models/src/lib/constants/permission';

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


  /**
   * prepare default role model for new project
   * @param project
   */
  public prepareDefaultRoles(project: Project, userId:string): UserRoleModel[] {
    const roles: UserRoleModel[] = [];
    DEFAULT_USER_ROLES.forEach(defaultRoles => {
      const role = new UserRoleModel();

      const allowedPermissions = PERMISSIONS;

      if(role.name === 'Supervisor') {

        //All permissions allowed
        Object.keys(allowedPermissions).forEach(key => {
          Object.keys(allowedPermissions[key]).forEach(childKey => {
            allowedPermissions[key][childKey]=true
          });
        });

      } else {

        //only 4 permissions allowed
        allowedPermissions.sprint.canCreate = true;
        allowedPermissions.task.canAddToSprint = true;
        allowedPermissions.task.canUpdateEstimate = true;
        allowedPermissions.task.canAdd = true;

      }

      role.accessPermissions = allowedPermissions;
      role.name = defaultRoles.name;
      role.projectId = project.id;
      role.createdById = userId;
      role.description = `${defaultRoles.name} is a default role which is provided with new Project`;

      roles.push(role);
    });

    return roles;
  }

}
