import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRequestModel, DbCollection, Project, ProjectMembers, User } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { BaseService } from '../shared/services/base.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectService extends BaseService<Project & Document> {
  constructor(
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    @InjectModel(DbCollection.users) private readonly _userModel: Model<User & Document>,
    private _userService: UsersService
  ) {
    super(_projectModel);
  }

  async addProject(model: Project) {
    const session = await this._projectModel.db.startSession();
    session.startTransaction();
    model = new this._projectModel(model);
    model.organization = this.toObjectId('5d99c928ef96a822b08a66d5');
    try {
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
      const createdUsers: any = await this._userService.createUser(unregisteredMembersModel, session);

      // assign newly created users to project members array
      model.members = model.members.map(m => {
        m.userId = m.userId ? m.userId : createdUsers.find(f => f.emailId === m.userId);
        m.isEmailSent = false;
        m.isInviteAccepted = false;
        return m;
      });

      // create project and get project id from them
      const createdProject = await this.create([model], session);
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
