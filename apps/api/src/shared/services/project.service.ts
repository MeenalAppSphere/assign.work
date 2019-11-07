import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BaseRequestModel,
  DbCollection,
  Project,
  ProjectMembers, ProjectPriority,
  ProjectStages, ProjectWorkingCapacityUpdateDto,
  TaskType,
  User
} from '@aavantan-app/models';
import { Document, Model, Types } from 'mongoose';
import { BaseService } from './base.service';
import { UsersService } from './users.service';
import { OrganizationService } from './organization.service';

@Injectable()
export class ProjectService extends BaseService<Project & Document> {
  constructor(
    @InjectModel(DbCollection.projects) protected readonly _projectModel: Model<Project & Document>,
    @InjectModel(DbCollection.users) private readonly _userModel: Model<User & Document>,
    @Inject(forwardRef(() => UsersService)) private readonly _userService: UsersService,
    @Inject(forwardRef(() => OrganizationService)) private readonly _organizationService: OrganizationService
  ) {
    super(_projectModel);
  }

  async addProject(model: Project) {
    const session = await this._projectModel.db.startSession();
    session.startTransaction();
    const organizationId = model.organization;
    model = new this._projectModel(model);
    model.organization = this.toObjectId(model.organization as string);
    try {
      // create project and get project id from them
      const createdProject = await this.create([model], session);

      const userDetails = await this._userService.findById(createdProject[0].createdBy as string);

      // if user is creating first project then mark it as
      if (!userDetails.projects.length) {
        userDetails.currentProject = createdProject[0].id;
      }

      userDetails.projects.push(createdProject[0].id);
      await this._userService.updateUser(userDetails.id, userDetails, session);

      await session.commitTransaction();
      session.endSession();
      return createdProject[0];
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async updateProject(id: string, project: Partial<Project>) {
    const session = await this._projectModel.db.startSession();
    session.startTransaction();

    try {
      const result = await this.update(id, project, session);
      await session.commitTransaction();
      session.endSession();
      return await this.findById(id);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async addCollaborators(id: string, members: ProjectMembers[]) {
    const session = await this._projectModel.db.startSession();
    session.startTransaction();

    const projectDetails: Project = await this.getProjectDetails(id);

    if (!Array.isArray(members)) {
      throw new BadRequestException('Please check provided json');
    }

    const alreadyRegisteredMembers: ProjectMembers[] = [];
    const unRegisteredMembers: ProjectMembers[] = [];
    const unregisteredMembersModel: Partial<User>[] = [];
    let finalMembers: ProjectMembers[] = [];

    try {
      members.forEach(member => {
        if (member.userId) {
          const inProject = projectDetails.members.some(s => s.userId === member.userId);
          if (!inProject) {
            alreadyRegisteredMembers.push(member);
          }
        } else {
          unRegisteredMembers.push(member);
        }
      });

      finalMembers = [...alreadyRegisteredMembers];

      unRegisteredMembers.forEach(f => {
        unregisteredMembersModel.push(
          new this._userModel({
            emailId: f.emailId,
            username: f.emailId
          })
        );
      });

      if (unRegisteredMembers.length) {
        const createdUsers: any = await this._userService.createUser(unregisteredMembersModel, session);

        finalMembers.push(...createdUsers.map(m => {
          return {
            userId: m.id,
            emailId: m.emailId
          };
        }));
      }

      const membersModel: ProjectMembers[] = finalMembers.map(member => {
        member.isEmailSent = false;
        member.isInviteAccepted = false;
        return member;
      });

      const result = await this.update(id, { members: [...projectDetails.members, ...membersModel] }, session);
      await session.commitTransaction();
      session.endSession();
      return await this.findById(id);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async removeCollaborator(id: string, projectId: string) {

    const projectDetails: Project = await this.getProjectDetails(projectId);

    projectDetails.members = projectDetails.members.filter(f => f.userId !== id);
    return await this.updateProject(projectId, projectDetails);
  }

  async updateCollaboratorWorkingCapacity(id: string, dto: ProjectWorkingCapacityUpdateDto[]) {
    const projectDetails: Project = await this.getProjectDetails(id);

    // check data
    const everyBodyThere = dto.every(ddt => projectDetails.members.some(pd => pd.userId === ddt.userId));
    if (!everyBodyThere) {
      throw new BadRequestException('One of Collaborator not found, Please try again');
    }

    projectDetails.members = projectDetails.members.map(pd => {
      const indexInDto = dto.findIndex(f => f.userId === pd.userId);
      if (indexInDto > -1) {
        pd.workingCapacity = dto[indexInDto].workingCapacity || 0;
      }
      return pd;
    });

    return await this.updateProject(id, projectDetails);
  }

  async getAllProject(query: any, reuest: BaseRequestModel) {
    query = this._projectModel.aggregate();
    return await this.getAllPaginatedData(query, reuest);
  }

  async deleteProject(id: string) {
    const session = await this._projectModel.db.startSession();
    session.startTransaction();

    try {
      await this.delete(id);
      await session.commitTransaction();
      session.endSession();
      return 'Project Deleted Successfully!';
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async createStage(id: string, stage: ProjectStages) {
    const projectDetails: Project = await this.getProjectDetails(id);

    if (!stage.name) {
      throw new BadRequestException('Please add name');
    }

    if (projectDetails.settings.stages) {
      const isDuplicate = projectDetails.settings.stages.some(s => s.name.toLowerCase() === stage.name.toLowerCase());

      if (isDuplicate) {
        throw new BadRequestException('Stage Name Already Exists');
      }
    } else {
      projectDetails.settings.stages = [];
    }

    stage.id = new Types.ObjectId().toHexString();
    projectDetails.settings.stages.push(stage);
    return await this.updateProject(id, projectDetails);
  }

  async removeStage(id: string, stageId: string) {
    const projectDetails: Project = await this.getProjectDetails(id);

    projectDetails.settings.stages = projectDetails.settings.stages.filter(f => f.id !== stageId);
    return await this.updateProject(id, projectDetails);
  }

  async createTaskType(id: string, taskType: TaskType) {
    const projectDetails: Project = await this.getProjectDetails(id);

    if (!taskType.name) {
      throw new BadRequestException('Please add name');
    }

    if (!taskType.color) {
      throw new BadRequestException('Please select color');
    }

    if (projectDetails.settings.taskTypes && projectDetails.settings.taskTypes.length) {
      const isDuplicate = projectDetails.settings.taskTypes.some(s => s.name.toLowerCase() === taskType.name.toLowerCase());

      if (isDuplicate) {
        throw new BadRequestException('Tasktype Name Already Exists');
      }
    } else {
      projectDetails.settings.taskTypes = [];
    }

    taskType.id = new Types.ObjectId().toHexString();
    projectDetails.settings.taskTypes.push(taskType);
    return await this.updateProject(id, projectDetails);
  }

  async removeTaskType(id: string, taskTypeId: string) {
    const projectDetails: Project = await this.getProjectDetails(id);

    projectDetails.settings.taskTypes = projectDetails.settings.taskTypes.filter(f => f.id !== taskTypeId);
    return await this.updateProject(id, projectDetails);
  }

  async createPriority(id: string, priority: ProjectPriority) {
    const projectDetails: Project = await this.getProjectDetails(id);

    if (!priority.name) {
      throw new BadRequestException('Please add name');
    }

    if (!priority.color) {
      throw new BadRequestException('Please select color');
    }

    if (projectDetails.settings.priorities) {
      const isDuplicate = projectDetails.settings.priorities.some(s => s.name.toLowerCase() === priority.name.toLowerCase());

      if (isDuplicate) {
        throw new BadRequestException('Priority Name Already Exists');
      }
    } else {
      projectDetails.settings.priorities = [];
    }

    priority.id = new Types.ObjectId().toHexString();
    projectDetails.settings.priorities.push(priority);
    return await this.updateProject(id, projectDetails);
  }

  async removePriority(id: string, priorityId: string) {
    const projectDetails: Project = await this.getProjectDetails(id);

    projectDetails.settings.priorities = projectDetails.settings.priorities.filter(f => f.id !== priorityId);
    return await this.updateProject(id, projectDetails);
  }

  private async getProjectDetails(id: string): Promise<Project> {
    const projectDetails: Project = await this._projectModel.findById(id).lean().exec();
    if (!projectDetails) {
      throw new NotFoundException('No Project Found');
    }
    return projectDetails;
  }
}
