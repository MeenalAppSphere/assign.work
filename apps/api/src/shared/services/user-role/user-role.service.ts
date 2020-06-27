import { BaseService } from '../base.service';
import { ClientSession, Document, Model } from 'mongoose';
import { DbCollection, Project, RoleTypeEnum, TaskStatusModel, UserRoleModel } from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { ModuleRef } from '@nestjs/core';
import { ProjectService } from '../project/project.service';
import { OnModuleInit } from '@nestjs/common';
import { aggregateConvert_idToId, BadRequest } from '../../helpers/helpers';
import { UserRoleUtilityService } from './user-role.utility.service';
import { GeneralService } from '../general.service';
import { DEFAULT_USER_ROLES } from '../../helpers/defaultValueConstant';
import { PERMISSIONS } from '../../../../../../libs/models/src/lib/constants/permission';

export class UserRoleService extends BaseService<UserRoleModel & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private _utilityService: UserRoleUtilityService;

  constructor(
    @InjectModel(DbCollection.userRole) private readonly _userRoleService: Model<UserRoleModel & Document>,
    private _moduleRef: ModuleRef, private readonly _generalService: GeneralService
  ) {
    super(_userRoleService);
  }

  onModuleInit(): void {
    this._projectService = this._moduleRef.get('ProjectService');

    this._utilityService = new UserRoleUtilityService();
  }

  /**
   * add update a user role
   * check project access
   * check model validations
   * @param model
   */
  async addUpdate(model: UserRoleModel) {
    return await this.withRetrySession(async (session: ClientSession) => {
      if (model.id) {
        await this.getDetails(model.projectId, model.id);
      }

      // check user role validations...
      this._utilityService.userRoleValidations(model);

      // check if duplicate
      if (model.id) {
        if (await this.isDuplicate(model, model.id)) {
          BadRequest('Duplicate Role is not allowed.');
        }
      } else {
        if (await this.isDuplicate(model)) {
          BadRequest('Duplicate Role is not allowed.');
        }
      }

      // user role model
      const userRole = new UserRoleModel();
      userRole.projectId = model.projectId;
      userRole.name = model.name;
      userRole.description = model.description;
      userRole.accessPermissions = model.accessPermissions;
      userRole.createdById = this._generalService.userId;

      if (!model.id) {
        // add
        const newUserRole = await this.create([userRole], session);
        return newUserRole[0];
      } else {
        // update
        userRole.id = model.id;
        userRole.updatedById = this._generalService.userId;
        await this.updateById(model.id, userRole, session);
        return userRole;
      }
    });
  }

  /**
   * get all user roles
   */
  public async getAllUserRoles(projectId: string) {
    await this._projectService.getProjectDetails(projectId);
    return this.dbModel.aggregate([{
      $match: { projectId: this.toObjectId(projectId), isDeleted: false }
    }, { $project: { createdAt: 0, updatedAt: 0, '__v': 0 } }, aggregateConvert_idToId]);
  }

  /**
   * get user role by id
   * @param projectId
   * @param roleId
   */
  async getUserRoleById(projectId: string, roleId: string) {
    try {

      if (!this.isValidObjectId(roleId)) {
        BadRequest('Role not found...');
      }

      const userRole = await this.findOne({
        filter: { projectId, _id: roleId },
        lean: true
      });

      if (userRole) {
        userRole.id = userRole._id;
      } else {
        BadRequest('Role not found...');
      }

      return userRole;
    } catch (e) {
      throw e;
    }
  }

  /**
   * get user role by type
   * @param projectId
   * @param roleType
   */
  async getUserRoleByType(projectId: string, roleType: RoleTypeEnum) {
    try {

      const userRole = await this.findOne({
        filter: { projectId, type: roleType },
        lean: true
      });

      if (userRole) {
        userRole.id = userRole._id;
      } else {
        BadRequest('Role not found...');
      }

      return userRole;
    } catch (e) {
      throw e;
    }
  }

  /**
   * get user role details by id
   * @param projectId
   * @param roleId
   */
  async getDetails(projectId: string, roleId: string) {
    try {
      if (!this.isValidObjectId(roleId)) {
        BadRequest('Role not found..');
      }

      const userRoleDetail = await this.findOne({
        filter: { _id: roleId, projectId: projectId },
        lean: true
      });

      if (!userRoleDetail) {
        BadRequest('Role not found...');
      } else {
        userRoleDetail.id = userRoleDetail._id;
      }

      return userRoleDetail;
    } catch (e) {
      throw e;
    }
  }

  /**
   * duplicate checker
   * check duplicity for name
   * if exceptThisId present than filter that record
   * @param userRole
   * @param exceptThisId
   */
  public async isDuplicate(userRole: UserRoleModel, exceptThisId: string = null): Promise<boolean> {
    const queryFilter = {
      $and: [
        { projectId: userRole.projectId },
        {
          $or: [
            { name: { $regex: `^${userRole.name.trim()}$`, $options: 'i' } }
          ]
        }
      ]
    };

    // if exceptThisId present then filter the result for this id
    if (exceptThisId) {
      queryFilter.$and.push({ _id: { $ne: exceptThisId } } as any);
    }

    const result = await this.find({
      filter: queryFilter
    });

    return !!(result && result.length);
  }

  public async addMissingUserRoles() {
    return this.withRetrySession(async (session: ClientSession) => {
      const projects = await this._projectService.find({
        filter: {}
      });

      if (projects && projects.length) {
        for (const project of projects) {
          project.id = project._id;
          const userRoles = await this.createDefaultRoles(project, session);

          if (userRoles && userRoles.length) {
            const supervisorRole = userRoles[0];
            const teamMemberRole = userRoles[1];

            project.members = project.members.map((member, index) => {
              if (index === 0) {
                member.userRoleId = supervisorRole._id;
              } else {
                member.userRoleId = teamMemberRole._id;
              }
              return member;
            });

            await this._projectService.updateById(project._id, { $set: { members: project.members } }, session);
          }
        }
      }
    });
  }

  /**
   * create default roles for project
   * @param project
   * @param session
   */
  async createDefaultRoles(project: Project, session: ClientSession): Promise<Array<Document & UserRoleModel>> {
    const defaultRoles = this._utilityService.prepareDefaultRoles(project);

    return await this.createMany(defaultRoles, session) as Array<Document & UserRoleModel>;
  }

}
