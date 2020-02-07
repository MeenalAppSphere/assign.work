import { Project, ProjectMembers, User } from '@aavantan-app/models';
import { BadRequest } from '../../helpers/helpers';
import {
  DEFAULT_WORKING_CAPACITY,
  DEFAULT_WORKING_CAPACITY_PER_DAY,
  DEFAULT_WORKING_DAYS
} from '../../helpers/defaultValueConstant';

export class ProjectUtilityService {
  constructor() {
  }

  checkAddProjectValidations(project: Project) {
    if (!project.name || !project.name.trim()) {
      BadRequest('Project name is required');
    }
  }

  prepareProjectModelFromRequest(requestModel: Project): Project {
    const project = new Project();

    project.name = requestModel.name;
    project.description = requestModel.description;
    project.organizationId = requestModel.organizationId;
    project.settings = {
      taskTypes: [],
      priorities: [],
      statuses: [],
      tags: []
    };

    return project;
  }

  prepareProjectMemberModel(user: User): ProjectMembers {
    return {
      userId: user.id,
      emailId: user.emailId,
      isEmailSent: true,
      isInviteAccepted: true,
      workingCapacity: DEFAULT_WORKING_CAPACITY,
      workingCapacityPerDay: DEFAULT_WORKING_CAPACITY_PER_DAY,
      workingDays: DEFAULT_WORKING_DAYS
    } as ProjectMembers;
  }

  /**
   * check if user is part of project
   * @param userId
   * @param projectDetails
   */
  public userPartOfProject(userId: string, projectDetails: Project) {
    return projectDetails.members.some(s => s.userId === userId && s.isInviteAccepted === true) || (projectDetails.createdBy as User)['_id'].toString() === userId;
  }
}
