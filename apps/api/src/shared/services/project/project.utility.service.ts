import { Project, User } from '@aavantan-app/models';

export class ProjectUtilityService {
  constructor() {
  }

  /**
   * check if user is part of project
   * @param userId
   * @param projectDetails
   */
  public userPartOfProject(userId: string, projectDetails: Project) {
    return projectDetails.members.some(s => s.userId === userId && s.isInviteAccepted === true) || (projectDetails.createdBy as User)['_id'].toString() === userId;
  }

  public checkStatusIsCategory(statusId: string, projectDetails: Project) {
    const status = projectDetails.settings.status.find(projectStatus => projectStatus.id.toString() === statusId);
  }
}
