import { Project, RoleTypeEnum, UserRoleModel } from '@aavantan-app/models';
import { BadRequest, isValidString, maxLengthValidator } from '../../helpers/helpers';
import { DEFAULT_USER_ROLES } from '../../helpers/defaultValueConstant';
import { PERMISSIONS } from '../../../../../../libs/models/src/lib/constants/permission';
import { cloneDeep } from 'lodash';

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
   * @param userId
   */
  public prepareDefaultRoles(project: Project): UserRoleModel[] {
    const roles: UserRoleModel[] = [];
    DEFAULT_USER_ROLES.forEach(defaultRoles => {
      const role = new UserRoleModel();
      let roleType = null;

      const allowedPermissions = cloneDeep(PERMISSIONS);
      if (defaultRoles.type === RoleTypeEnum.owner) {
        //All permissions allowed
        Object.keys(allowedPermissions).forEach(key => {
          Object.keys(allowedPermissions[key]).forEach(childKey => {
            allowedPermissions[key][childKey] = true;
          });
        });
        roleType = RoleTypeEnum.owner;
      } else if (defaultRoles.type === RoleTypeEnum.supervisor) {
        //All permissions allowed
        Object.keys(allowedPermissions).forEach(key => {
          Object.keys(allowedPermissions[key]).forEach(childKey => {
            allowedPermissions[key][childKey] = true;
            if(childKey === 'canRemove_settings') {
              allowedPermissions[key][childKey] = false;
            }
          });
        });
        roleType = RoleTypeEnum.supervisor;
      } else if (defaultRoles.type === RoleTypeEnum.sponsor) {
        allowedPermissions.task.canModifyEstimate_task = true;
        allowedPermissions.task.canAdd_task = true;
        roleType = RoleTypeEnum.sponsor;
      } else {
        //only 4 permissions allowed
        allowedPermissions.sprint.canCreate_sprint = true;
        allowedPermissions.sprint.canAddTaskToSprint_sprint = true;
        allowedPermissions.task.canModifyEstimate_task = true;
        allowedPermissions.task.canAdd_task = true;
        roleType = RoleTypeEnum.teamMember;
      }

      role.accessPermissions = allowedPermissions;
      role.type = roleType;
      role.name = defaultRoles.name;
      role.projectId = project.id;
      role.createdById = project.createdById;
      role.description = `${defaultRoles.name} is a default role which is provided with new Project`;

      roles.push(role);
    });

    return roles;
  }
}
