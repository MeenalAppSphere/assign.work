import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DbCollection, MongoosePaginateQuery, User } from '@aavantan-app/models';
import { ClientSession, Document, Model, Query, Types } from 'mongoose';
import { BaseService } from './base.service';
import { ProjectService } from './project.service';
import { sortBy, slice, orderBy } from 'lodash';
import * as moment from 'moment';

@Injectable()
export class UsersService extends BaseService<User & Document> {
  constructor(@InjectModel(DbCollection.users) protected readonly _userModel: Model<User & Document>,
              @Inject(forwardRef(() => ProjectService)) private readonly _projectService: ProjectService) {
    super(_userModel);
  }

  async getAllWithPagination() {
    const query = new Query();
    const paginationRequest = new MongoosePaginateQuery();
    paginationRequest.populate = 'projects';
    return await this.getAllPaginatedData({}, paginationRequest);
  }

  async getAll() {
    return this.find();
  }

  async createUser(user: Partial<User> | Array<Partial<User>>, session: ClientSession) {
    return await this.create(user, session);
  }

  async updateUser(id: string, user: any, session?: ClientSession) {
    if (session) {
      return await this.update(id, user, session);
    } else {
      session = await this._userModel.db.startSession();
      session.startTransaction();

      try {
        const result = await this.update(id, user, session);
        await session.commitTransaction();
        session.endSession();
        return result;
      } catch (e) {
        await session.abortTransaction();
        session.endSession();
        throw e;
      }
    }
  }

  async getUserProfile(id: string) {
    const userDetails = await this._userModel.findById(new Types.ObjectId(id))
      .populate([{
        path: 'projects',
        select: 'name description organization'
      },
        {
          path: 'organizations',
          select: 'name description'
        },
        {
          path: 'currentProject',
          populate: {
            path: 'members.userDetails'
          },
          select: 'name description members settings template createdBy updatedBy',
          justOne: true
        }, {
          path: 'currentOrganization',
          select: 'name description displayName logoUrl',
          justOne: true
        }]).lean();

    if (!userDetails) {
      throw new UnauthorizedException();
    }

    userDetails.id = userDetails._id;

    if (userDetails.currentProject) {
      userDetails.currentProject.id = userDetails.currentProject._id.toString();
    }

    if (userDetails.currentOrganization) {
      userDetails.currentOrganization.id = userDetails.currentOrganization._id.toString();
      userDetails.currentOrganizationId = userDetails.currentOrganization.id;
    } else if (userDetails.organizations.length) {
      userDetails.currentOrganization = userDetails.organizations[0];
      userDetails.currentOrganization.id = userDetails.currentOrganization._id.toString();
      userDetails.currentOrganizationId = userDetails.currentOrganization.id;
    }

    // get only current organization project
    // filter out current project
    // sort by updated at
    // limit only recent two projects

    userDetails.projects =
      slice(
        orderBy(userDetails.projects
            .filter(f => f.organization.toString() === userDetails.currentOrganizationId)
            .filter(f => f._id.toString() !== userDetails.currentProject.id),
          (project) => {
            return moment(project.updatedAt).toDate();
          }, 'asc'), 0, 2
      )
        .map(pro => {
          pro.id = pro._id;
          return pro;
        });

    // get only current user organization
    // filter current project
    // sort by updated at
    // limit only recent two organization

    userDetails.organizations =
      slice(
        orderBy(userDetails.organizations
            .filter(f => f._id.toString() !== userDetails.currentOrganizationId.toString()),
          (organization) => {
            return moment(organization.updatedAt).toDate();
          }, 'desc'), 0, 2
      )
        .map(org => {
          org.id = org._id;
          return org;
        });

    return userDetails;
  }
}
