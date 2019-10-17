import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRequestModel, DbCollection, Project, ProjectMembers, User } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { BaseService } from '../shared/services/base.service';
import { UsersService } from '../users/users.service';
import { OrganizationService } from '../organization/organization.service';

@Injectable()
export class ProjectService extends BaseService<Project & Document> {
  constructor(
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    @InjectModel(DbCollection.users) private readonly _userModel: Model<User & Document>,
    private readonly _userService: UsersService,
    private readonly _organizationService: OrganizationService
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
      // get organization object
      // const organization = await this._organizationService.findById(organizationId as string);

      // get unregistered members
      const unregisteredMembers: string[] = model.members.filter(f => !f.userId && f.emailId).map(m => m.emailId);
      const unregisteredMembersModel: Partial<User>[] = [];

      unregisteredMembers.forEach(f => {
        unregisteredMembersModel.push(
          new this._userModel({
            emailId: f,
            username: f
          })
        );
      });

      // create unregistered users and get user id from them
      if (unregisteredMembersModel.length) {
        const createdUsers: any = await this._userService.createUser(unregisteredMembersModel, session);


        // add newly created users to organization members array
        // organization.members.push(...createdUsers.map(m => m.id));
        // await organization.updateOne(organization, { session });

        // assign newly created users to project members array
        model.members = model.members.map(m => {
          m.userId = m.userId ? m.userId : createdUsers.find(f => f.emailId === m.userId);
          m.isEmailSent = false;
          m.isInviteAccepted = false;
          return m;
        });
      }

      // create project and get project id from them
      const createdProject = await this.create([model], session);
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
      return result;
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
            emailId: f,
            username: f
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
}
