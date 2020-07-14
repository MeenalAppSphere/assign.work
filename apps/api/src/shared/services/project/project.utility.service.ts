import { Project, ProjectMembers, UpdateProjectRequestModel, User } from '@aavantan-app/models';
import { BadRequest, maxLengthValidator, secondsToHours, validOrganizationOrProjectName } from '../../helpers/helpers';
import {
  DEFAULT_WORKING_CAPACITY,
  DEFAULT_WORKING_CAPACITY_PER_DAY,
  DEFAULT_WORKING_DAYS
} from '../../helpers/defaultValueConstant';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

export class ProjectUtilityService {
  constructor() {
  }

  /**
   * check add project validations
   * @param project
   */
  checkAddUpdateProjectValidations(project: Project | UpdateProjectRequestModel) {
    if (!project) {
      BadRequest('Project name is required');
    }

    // name validation
    if (!project.name || !project.name.trim()) {
      BadRequest('Project name is required');
    }

    // name valid string
    if (!validOrganizationOrProjectName(project.name)) {
      BadRequest('Invalid project name');
    }

    // max length validation
    if (!maxLengthValidator(project.name, 250)) {
      BadRequest('Project name should not be grater than 250 characters');
    }
  }

  /**
   * prepare project model from request
   * @param requestModel
   */
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
    project.members = [];

    return project;
  }

  /**
   * prepare project member model
   * @param user
   */
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
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found');
    }
    return projectDetails.members.some(s => s.userId === userId && s.isInviteAccepted === true && !s.isRemoved) || (projectDetails.createdBy as User)['_id'].toString() === userId;
  }

  /**
   * create project vm model
   * @param project
   */
  public parseProjectToVm(project: Project): Project {
    project.id = project._id;

    project.members = project.members
      // .filter(member => {
      //   return !member.isRemoved;
      // })
      .map(member => {
        member.workingCapacity = secondsToHours(member.workingCapacity);
        member.workingCapacityPerDay = secondsToHours(member.workingCapacityPerDay);
        return member;
      });

    if (project.activeBoard) {
      project.activeBoard.id = project.activeBoard._id;
    }

    // generate color for project
    // project.color = this._generalService.generateRandomColor();
    return project;
  }
}
