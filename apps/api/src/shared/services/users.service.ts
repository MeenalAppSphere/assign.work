import { BadRequestException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ChangePasswordModel, DbCollection, SearchUserModel, User, UserLoginProviderEnum } from '@aavantan-app/models';
import { ClientSession, Document, Model, Types } from 'mongoose';
import { BaseService } from './base.service';
import { ProjectService } from './project/project.service';
import { slice } from 'lodash';
import { GeneralService } from './general.service';
import { BadRequest } from '../helpers/helpers';
import { SprintUtilityService } from './sprint/sprint.utility.service';
import { ModuleRef } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { HASH_PASSWORD_SALT_ROUNDS } from '../helpers/defaultValueConstant';

@Injectable()
export class UsersService extends BaseService<User & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _sprintUtilityService: SprintUtilityService;

  constructor(@InjectModel(DbCollection.users) protected readonly _userModel: Model<User & Document>,
              private _generalService: GeneralService, private _moduleRef: ModuleRef) {
    super(_userModel);

    this._sprintUtilityService = new SprintUtilityService();
  }

  onModuleInit() {
    this._projectService = this._moduleRef.get('ProjectService');
  }

  /**
   * change password
   * first find user with email id
   * then compare currentPassword
   * if it matches than change current password with new password
   * @param model
   */
  async changePassword(model: ChangePasswordModel) {
    // email id validation
    if (!model || !model.emailId) {
      BadRequest('User not found');
    }

    // current password validation
    if (!model.currentPassword) {
      BadRequest('Please enter your current password');
    }

    // new password validation
    if (!model.newPassword) {
      BadRequest('Please enter your new password');
    }

    // current and new password both are same validation
    if (model.currentPassword === model.newPassword) {
      BadRequest('Current Password and New Password can not be same, please choose different password');
    }

    return this.withRetrySession(async (session: ClientSession) => {
      // get user by email id
      const user: User = await this.findOne({
        filter: { emailId: model.emailId }, lean: true
      });

      // check if user is there
      if (user) {
        // check if user is logged in with user name and password not with any social login helper
        if (!user.password || user.lastLoginProvider !== UserLoginProviderEnum.normal) {
          throw new UnauthorizedException('Your\'e not logged with Email And Password, So you can\'t change password!');
        } else {
          // compare hashed password
          const isPasswordMatched = await bcrypt.compare(model.currentPassword, user.password);

          if (isPasswordMatched) {
            // update user password
            const hashedPassword = await bcrypt.hash(model.newPassword, HASH_PASSWORD_SALT_ROUNDS);
            await this.updateById(user._id, { $set: { password: hashedPassword } }, session);

            // return jwt token
            return 'Password Changed Successfully';
          } else {
            // throw invalid login error
            throw new UnauthorizedException('Invalid email or password');
          }
        }
      } else {
        // throw invalid login error
        throw new UnauthorizedException('Invalid email or password');
      }
    });
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

  /**
   * create new user
   * @param user
   * @param session
   */
  async createUser(user: Partial<User & Document> | Array<Partial<User & Document>>, session: ClientSession) {
    return await this.create(user, session);
  }

  /**
   * update user
   * @param id
   * @param user
   * @param session
   */
  async updateUser(id: string, user: any, session?: ClientSession) {
    if (session) {
      return await this.updateById(id, user, session);
    } else {
      session = await this._userModel.db.startSession();
      session.startTransaction();

      try {
        const result = await this.updateById(id, user, session);
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

  /**
   * get user profile
   * @param id
   */
  async getUserProfile(id: string) {
    const userDetails = await this._userModel.findById(new Types.ObjectId(id))
      .populate([{
        path: 'projects',
        select: 'name description organizationId createdAt createdById updatedAt',
        populate: [{
          path: 'createdBy',
          select: 'firstName lastName'
        }, {
          path: 'organization',
          select: 'name description displayName logoUrl'
        }],
        options: {
          sort: { 'updatedAt': -1 }
        }
      },
        {
          path: 'organizations',
          select: 'name description updatedAt',
          options: {
            sort: { 'updatedAt': -1 }
          }
        },
        {
          path: 'currentProject',
          select: 'name description organizationId members settings template createdById updatedBy sprintId activeBoardId',
          justOne: true,
          populate: [{
            path: 'members.userDetails',
            select: 'firstName lastName emailId userName profilePic sprintId'
          }, {
            path: 'sprint',
            select: 'name goal startedAt endAt totalCapacity totalEstimation totalLoggedTime totalOverLoggedTime reportId'
          }, {
            path: 'createdBy',
            select: 'firstName lastName'
          }, {
            path: 'organization',
            select: 'name description displayName logoUrl'
          }, {
            path: 'activeBoard',
            populate: {
              path: 'columns.headerStatus'
            }
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
      userDetails.currentProject = this._projectService.parseProjectToVm(userDetails.currentProject);

      if (userDetails.currentProject.sprint) {
        userDetails.currentProject.sprint.id = userDetails.currentProject.sprint._id;
        this._sprintUtilityService.calculateSprintEstimates(userDetails.currentProject.sprint);
      }
    }

    if (userDetails.currentOrganization) {
      userDetails.currentOrganization.id = userDetails.currentOrganization._id.toString();
      userDetails.currentOrganizationId = userDetails.currentOrganization.id;
    }


    /*
      get only current organization project
      filter out current project
      sort by updated at
      limit only recent 1 project
     */

    // check if current project and current organization is available
    if (userDetails.currentProject && userDetails.currentOrganization) {
      const userProjects =
        slice(
          userDetails.projects
            .filter(f => f.organizationId.toString() === userDetails.currentOrganizationId)
            .filter(f => f._id.toString() !== userDetails.currentProject.id),
          0, 1
        ).map((pro: any) => {
          pro.id = pro._id.toString();
          return pro;
        });

      // add current project at first index of recent project list
      if (userDetails.currentProject) {
        userProjects.splice(0, 0, userDetails.currentProject);
      }
      userDetails.projects = userProjects;

      // get only current user organization
      // filter current project
      // sort by updated at
      // limit only recent two organization

      const userOrganizations =
        userDetails.organizations
          .filter(f => f._id.toString() !== userDetails.currentOrganizationId.toString())
          .map((org: any) => {
            org.id = org._id.toString();
            return org;
          });

      // add current organization at first index of recent project list
      if (userDetails.currentOrganization) {
        userOrganizations.splice(0, 0, userDetails.currentOrganization);
      }
      userDetails.organizations = userOrganizations;
    } else {
      /*
      * check if user have projects and organizations
      * this will be only possible when user have pending invitations
      */

      // projects
      if (userDetails.projects && userDetails.projects.length) {
        userDetails.projects = userDetails.projects.map(project => {
          project.id = project._id.toString();
          return project;
        });
      }

      // organizations
      if (userDetails.organizations && userDetails.organizations) {
        userDetails.organizations = userDetails.organizations.map(organization => {
          organization.id = organization._id.toString();
          return organization;
        });
      }
    }
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
}
