import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BaseRequestModel,
  DbCollection,
  Project,
  ProjectMembers,
  ProjectStages,
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
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
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

    const projectDetails: Project = await this._projectModel.findById(id).lean().exec();

    if (!projectDetails) {
      throw new NotFoundException('No Project Found');
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

      const result = await this.update(id, { members: membersModel }, session);
      await session.commitTransaction();
      session.endSession();
      return result;
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

    stage.id = new Types.ObjectId().toHexString();
    const isDuplicate = projectDetails.settings.stages.some(s => s.name.toLowerCase() === stage.name.toLowerCase());

    if (isDuplicate) {
      throw new BadRequestException('Stage Name Already Exists');
    }
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

    const isDuplicate = projectDetails.settings.taskTypes.some(s => s.name.toLowerCase() === taskType.name.toLowerCase());

    if (isDuplicate) {
      throw new BadRequestException('Tasktype Name Already Exists');
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

  private async getProjectDetails(id: string): Promise<Project> {
    const projectDetails: Project = await this._projectModel.findById(id).lean().exec();
    if (!projectDetails) {
      throw new NotFoundException('No Project Found');
    }
    return projectDetails;
  }
}
