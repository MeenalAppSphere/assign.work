import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DbCollection, MongoosePaginateQuery, Project, SearchUserModel, User } from '@aavantan-app/models';
import { ClientSession, Document, Model, Query, Types } from 'mongoose';
import { BaseService } from './base.service';
import { ProjectService } from './project.service';
import { orderBy, slice } from 'lodash';
import * as moment from 'moment';
import { GeneralService } from './general.service';
import { secondsToHours } from '../helpers/helpers';

@Injectable()
export class UsersService extends BaseService<User & Document> {
  constructor(@InjectModel(DbCollection.users) protected readonly _userModel: Model<User & Document>,
              @Inject(forwardRef(() => ProjectService)) private readonly _projectService: ProjectService,
              private _generalService: GeneralService) {
    super(_userModel);
  }

  async getAllWithPagination() {
    const query = new Query();
    const paginationRequest = new MongoosePaginateQuery();
    paginationRequest.populate = 'projects';
    return await this.getAllPaginatedData({}, paginationRequest);
  }

  /**
   * search users
   * with email id, first name or last name, don't include current user
   * @returns {Promise<User[]>}
   * @param model
   */
  async searchUser(model: SearchUserModel) {
    if (!this.isValidObjectId(model.organizationId)) {
      throw new BadRequestException('organization not found');
    }
    return this.find({
      filter: {
        $or: [
          { emailId: { $regex: new RegExp(model.query), $options: 'i' } },
          { firstName: { $regex: new RegExp(model.query), $options: 'i' } },
          { lastName: { $regex: new RegExp(model.query), $options: 'i' } }
        ],
        _id: {
          $nin: [this.toObjectId(this._generalService.userId)]
        },
        currentOrganizationId: model.organizationId
      },
      select: 'emailId firstName lastName profilePic _id'
    });
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
        select: 'name description organization createdAt createdBy',
        populate: {
          path: 'createdBy',
          select: 'firstName lastName'
        }
      },
        {
          path: 'organizations',
          select: 'name description'
        },
        {
          path: 'currentProject',
          select: 'name description members settings template createdBy updatedBy sprintId',
          justOne: true,
          populate: [{
            path: 'members.userDetails',
            select: 'firstName lastName emailId userName profilePic sprintId'
          }, {
            path: 'sprint',
            select: 'name goal'
          }]
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
      userDetails.currentProject = this.parseProjectToVm(userDetails.currentProject);
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
    // limit only recent 1 project

    const userProjects =
      slice(
        orderBy(userDetails.projects
            .filter(f => f.organization.toString() === userDetails.currentOrganizationId)
            .filter(f => f._id.toString() !== userDetails.currentProject.id),
          (project) => {
            return moment(project.updatedAt).toDate();
          }, 'desc'), 0, 1
      )
        .map(pro => {
          pro.id = pro._id;
          return pro;
        });

    // add current project at first index
    userProjects.splice(0, 0, userDetails.currentProject);

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

  /**
   * update user profile
   * @param model
   */
  async updateUserProfile(model: User) {
    // remove things which can not be updated
    delete model.emailId;
    delete model.password;
    delete model.username;
    delete model.status;
    delete model.organizations;
    delete model.projects;
    delete model.lastLoginProvider;
  }

  /**
   * parse project to view model
   * @param project
   * @returns {Project}
   */
  private parseProjectToVm(project: Project): Project {
    if (!project) {
      return project;
    }

    project.members = project.members.map(member => {
      member.workingCapacity = secondsToHours(member.workingCapacity);
      member.workingCapacityPerDay = secondsToHours(member.workingCapacityPerDay);
      return member;
    });

    return project;
  }
}
