import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRequestModel, DbCollection, ProjectMembers, User } from '@aavantan-app/models';
import { Model, Document } from 'mongoose';
import { Project } from '@aavantan-app/models';
import { BaseService } from '../shared/services/base.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectService extends BaseService<Project & Document> {
  constructor(
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    private readonly _userService: UsersService
  ) {
    super(_projectModel);
  }

  async addProject(model: Project) {
    const session = await this._projectModel.db.startSession();
    session.startTransaction();

    try {
      const unregisteredMembers: string[] = model.members.filter(f => !f.userId && f.emailId).map(m => m.emailId);
      const unregisteredMembersModel: Partial<User>[] = [];
      unregisteredMembers.forEach(f => {
        unregisteredMembersModel.push({
          emailId: f,
          username: f
        });
      });

      // create unregistered users and get user id from them
      const createdUsers = await this._userService.createUser(unregisteredMembersModel, session) as (User & Document)[];

      // assign newly created users to project members array
      const members: ProjectMembers[] = model.members.map(m => {
        m.userId = createdUsers.find(f => f.emailId === m.emailId).id;
        m.isEmailSent = false;
        m.isInviteAccepted = false;
        return m;
      });

      model.members = members;
      // create project and get project id from them
      const createdProject = await this.create(new this._projectModel(model), session);
      await session.commitTransaction();
      session.endSession();
      return createdProject;
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      return e;
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
      return e;
    }
  }
}
