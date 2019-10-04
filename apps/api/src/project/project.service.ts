import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRequestModel, DbCollection } from '@aavantan-app/models';
import { Model, Document } from 'mongoose';
import { Project } from '@aavantan-app/models';
import { BaseService } from '../shared/services/base.service';

@Injectable()
export class ProjectService extends BaseService<Project & Document> {
  constructor(@InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>) {
    super(_projectModel);
  }

  async addProject(model: Project) {
    const unregisteredMembers: string[] = model.members.filter(f => !f.userId && f.emailId).map(m => m.emailId);
    // create user and get user id from them

    return await this.create(new this._projectModel(model));
  }

  async getAllProject(query: any, reuest: BaseRequestModel) {
    query = this._projectModel.aggregate();
    return await this.getAllPaginatedData(query, reuest);
  }
}
