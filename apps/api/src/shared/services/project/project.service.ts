import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  DbCollection,
  EmailTemplatePathEnum,
  GetAllProjectsModel,
  Invitation,
  MongooseQueryModel,
  Organization,
  Project,
  ProjectInvitationType,
  ProjectMembers,
  ProjectStages,
  ProjectStageSequenceChangeRequest,
  ProjectTags,
  ProjectTemplateEnum,
  ProjectTemplateUpdateModel,
  ProjectWorkingCapacityUpdateDto,
  ResendProjectInvitationModel,
  SearchProjectCollaborators,
  SearchProjectRequest,
  SearchProjectTags,
  Sprint,
  SprintColumn,
  SwitchProjectRequest, TaskStatusModel,
  User,
  UserStatus
} from '@aavantan-app/models';
import { ClientSession, Document, Model, Types } from 'mongoose';
import { BaseService } from '../base.service';
import { UsersService } from '../users.service';
import { GeneralService } from '../general.service';
import {
  DEFAULT_WORKING_CAPACITY,
  DEFAULT_WORKING_CAPACITY_PER_DAY,
  DEFAULT_WORKING_DAYS
} from '../../helpers/defaultValueConstant';
import {
  BadRequest,
  generateUtcDate,
  hourToSeconds,
  secondsToHours,
  validWorkingDaysChecker
} from '../../helpers/helpers';
import { environment } from '../../../environments/environment';
import { InvitationService } from '../invitation.service';
import { ModuleRef } from '@nestjs/core';
import { EmailService } from '../email.service';
import { OrganizationService } from '../organization.service';
import { ProjectUtilityService } from './project.utility.service';
import { TaskStatusService } from '../task-status/task-status.service';
import { BoardService } from '../board/board.service';

const projectBasicPopulation = [{
  path: 'members.userDetails',
  select: 'firstName lastName emailId userName profilePic'
}, { path: 'settings.statuses' }, { path: 'settings.taskTypes' }, { path: 'settings.priorities' }];

@Injectable()
export class ProjectService extends BaseService<Project & Document> implements OnModuleInit {
  private _userService: UsersService;
  private _invitationService: InvitationService;
  private _organizationService: OrganizationService;
  private _utilityService: ProjectUtilityService;
  private _taskStatusService: TaskStatusService;
  private _boardService: BoardService;

  constructor(
    @InjectModel(DbCollection.projects) protected readonly _projectModel: Model<Project & Document>,
    @InjectModel(DbCollection.users) private readonly _userModel: Model<User & Document>,
    @InjectModel(DbCollection.organizations) private readonly _organizationModel: Model<Organization & Document>,
    @InjectModel(DbCollection.sprint) private readonly _sprintModel: Model<Sprint & Document>,
    private readonly _generalService: GeneralService, private _moduleRef: ModuleRef, private _emailService: EmailService
  ) {
    super(_projectModel);
  }

  onModuleInit(): any {
    // get services from module
    this._userService = this._moduleRef.get('UsersService');
    this._invitationService = this._moduleRef.get('InvitationService');
    this._organizationService = this._moduleRef.get('OrganizationService');
    this._taskStatusService = this._moduleRef.get('TaskStatusService');
    this._boardService = this._moduleRef.get('BoardService');

    this._utilityService = new ProjectUtilityService();
  }

  /**
   * create project
   * @param model: Project
   * first check basic validations then set all default values
   * then add project creator as collaborator
   * if this is first project of a user than set it as current project of user
   * update user object in db
   * return {Project}
   */
  async createProject(model: Project) {
    const newProject = await this.withRetrySession(async (session: ClientSession) => {
      // get organization details
      await this.getOrganizationDetails(model.organizationId);

      // check validations
      this._utilityService.checkAddProjectValidations(model);

      // get user details
      const userDetails = await this._userService.findById(this._generalService.userId);
      if (!userDetails) {
        BadRequest('User not found');
      }

      if (!await this.isDuplicate(model)) {
        BadRequest('Duplicate Project Name not allowed');
      }

      const projectModel = this._utilityService.prepareProjectModelFromRequest(model);
      projectModel.createdById = this._generalService.userId;

      // add project creator as project collaborator when new project is created
      projectModel.members.push(this._utilityService.prepareProjectMemberModel(userDetails));

      // create project and get project id from them
      const createdProject = await this.create([projectModel], session);

      // create default statues for project
      const defaultStatues = await this._taskStatusService.createDefaultStatuses(createdProject[0], session);

      if (defaultStatues && defaultStatues.length) {
        defaultStatues.forEach(status => {
          projectModel.settings.statuses.push(status.id);
          createdProject[0].settings.statuses.push(status.id);
        });
      }

      // create default board goes here
      const defaultBoard = await this._boardService.createDefaultBoard(createdProject[0], session);

      // update project and set default statues and active board
      await this.updateById(createdProject[0].id, {
        $push: { 'settings.statuses': { $each: projectModel.settings.statuses } },
        $set: { activeBoardId: defaultBoard[0].id }
      }, session);

      // set created project as current project of user
      userDetails.currentProject = createdProject[0].id;
      // push project to user projects array
      userDetails.projects.push(createdProject[0].id);

      // update user
      await this._userService.updateUser(userDetails.id, userDetails, session);
      return createdProject[0];
    });
    // get project by id and send it
    return await this.findById(newProject.id);
  }

  /**
   * update project by id
   * @param id
   * @param model
   */
  async updateProject(id: string, model: Project) {
    // validations
    if (!model.id) {
      throw new BadRequestException('Invalid request');
    }

    if (model.name && !model.name.trim()) {
      throw new BadRequestException('Please Enter Project Name');
    }

    // get organization details
    const organizationDetails = await this.getOrganizationDetails(model.organizationId);
    const projectDetails = await this.getProjectDetails(model.id);

    // get user details
    const userDetails = await this._userService.findById(model.createdBy as string);
    if (!userDetails) {
      throw new BadRequestException('User not found');
    }

    const session = await this.startSession();

    const updatedProject = new Project();
    updatedProject.name = model.name;
    updatedProject.updatedById = this._generalService.userId;
    updatedProject.description = model.description;

    try {
      await this.updateById(id, updatedProject, session);
      await this.commitTransaction(session);
      const result = await this.findById(id, projectBasicPopulation);
      return this.parseProjectToVm(result);
    } catch (e) {
      await this.abortTransaction(session);
      throw e;
    }
  }

  /**
   * add collaborator to project
   * separate registered and unregistered collaborators
   * create users in db from unregistered collaborators
   * send project invitation to registered and unregistered collaborators
   * @param id
   * @param collaborators
   */
  async addCollaborators(id: string, collaborators: ProjectMembers[]) {
    if (!Array.isArray(collaborators)) {
      throw new BadRequestException('invalid request');
    }

    const projectDetails: Project = await this.getProjectDetails(id);

    const session = await this.startSession();

    const collaboratorsAlreadyInDb: ProjectMembers[] = [];
    const collaboratorsNotInDb: ProjectMembers[] = [];
    const collaboratorsAlreadyInDbButInviteNotAccepted: ProjectMembers[] = [];
    let finalCollaborators: ProjectMembers[] = [];

    try {
      collaborators.forEach(collaborator => {
        // collaborator userId exists then collaborator is available in db
        if (collaborator.userId) {
          // check if user is not adding him/her self to project as collaborator
          if (collaborator.userId === this._generalService.userId) {
            throw new BadRequestException('You can\'t add your self as collaborator');
          }

          // find if some collaborators are in project but invite is not accepted yet
          const inProjectIndex = projectDetails.members.findIndex(s => s.userId === collaborator.userId);
          if (inProjectIndex > -1 && !projectDetails.members[inProjectIndex].isInviteAccepted) {
            collaboratorsAlreadyInDbButInviteNotAccepted.push(collaborator);
          } else {
            collaboratorsAlreadyInDb.push(collaborator);
          }
        } else {
          // collaborator not available in db
          collaboratorsNotInDb.push(collaborator);
        }
      });

      finalCollaborators.push(...collaboratorsAlreadyInDb);

      for (let i = 0; i < collaboratorsNotInDb.length; i++) {
        // in some cases collaborator is working in another organization
        // but we have added him/her as collaborator in our organization
        // so we need to find them by email id, is email id there then user is already a in db
        // then push it to collaboratorsAlreadyInDb array so we don't create user again
        const userFilter = {
          filter: {
            emailId: collaboratorsNotInDb[i].emailId
          }
        };

        const userDetails = await this._userService.findOne(userFilter);
        // if user details found means user is already in db but in different organization
        // then continue the loop, don't create user again and add it to collaboratorsAlreadyInDb array
        if (userDetails) {

          // check if user is not adding him/her self to project as collaborator
          if (userDetails.id === this._generalService.userId) {
            throw new BadRequestException('You can\'t add your self as collaborator');
          }

          collaboratorsAlreadyInDb.push({ emailId: userDetails.emailId, userId: userDetails.id });
          finalCollaborators.push({ emailId: userDetails.emailId, userId: userDetails.id });
          collaboratorsNotInDb.splice(i, 1);
          continue;
        }

        // create user model
        const userModel: User = { emailId: collaboratorsNotInDb[i].emailId, username: collaboratorsNotInDb[i].emailId };
        // create new user in db
        const newUser = await this._userService.createUser([userModel], session);

        // update userId property in collaboratorsNotInDb array
        collaboratorsNotInDb[i].userId = newUser[0].id;

        // push new created users to final collaborators array
        finalCollaborators.push({
          userId: newUser[0].id,
          emailId: newUser[0].emailId
        });
      }

      const emailArrays = [];

      // create invitation for collaborators already in db logic goes here
      await this.createInvitation(collaboratorsAlreadyInDb, projectDetails, ProjectInvitationType.normal, session, emailArrays);

      // create invitation logic collaborators not in db goes here
      await this.createInvitation(collaboratorsNotInDb, projectDetails, ProjectInvitationType.signUp, session, emailArrays);

      // create invitation for collaborators already in project but invite not accepted logic goes here
      await this.createInvitation(collaboratorsAlreadyInDbButInviteNotAccepted, projectDetails, ProjectInvitationType.normal, session, emailArrays);

      // start email sending process
      emailArrays.forEach(email => {
        this._emailService.sendMail(email.to, email.subject, email.message);
      });

      // update final collaborators array with default values
      finalCollaborators = finalCollaborators.map(collaborator => {
        collaborator.isEmailSent = true;
        collaborator.isInviteAccepted = false;
        collaborator.workingCapacity = DEFAULT_WORKING_CAPACITY;
        collaborator.workingCapacityPerDay = DEFAULT_WORKING_CAPACITY_PER_DAY;
        collaborator.workingDays = DEFAULT_WORKING_DAYS;
        return collaborator;
      });

      await this.updateById(id, { $push: { 'members': { $each: finalCollaborators } } }, session);
      await this.commitTransaction(session);
      const result = await this.findById(id, projectBasicPopulation);
      return this.parseProjectToVm(result);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /**
   * resend project invitation
   * check basic validations
   * find and expire already sent invitations to that user
   * create new invitation and send email again
   */
  async resendProjectInvitation(model: ResendProjectInvitationModel) {
    // check project details
    const projectDetails: Project = await this.getProjectDetails(model.projectId);

    // check if invitation To user exists or not
    const userDetails: User = await this._userService.findOne({
      filter: { emailId: model.invitationToEmailId },
      lean: true
    });

    if (!userDetails) {
      throw new BadRequestException('User not found or user not added as collaborator');
    } else {

      if (userDetails._id.toString() === this._generalService.userId) {
        throw new BadRequestException('You can\'t add your self as collaborator!');
      }

      // if user exist then check if he's added to project as collaborator or not
      const isProjectMember = projectDetails.members.some(s => s.userId === userDetails._id.toString());

      // if not added as collaborator then throw error
      if (!isProjectMember) {
        throw new BadRequestException('User is not added as collaborator');
      }
    }

    const session = await this.startSession();

    try {
      // find all already sent invitations
      const alreadySentInvitationQuery = new MongooseQueryModel();
      alreadySentInvitationQuery.filter = {
        invitedById: this._generalService.userId,
        invitationToId: userDetails._id.toString(),
        projectId: model.projectId,
        isInviteAccepted: false,
        isExpired: false
      };

      // expire all already sent invitations
      await this._invitationService.bulkUpdate(alreadySentInvitationQuery, { $set: { isExpired: true } }, session);

      // create new invitation object
      const newInvitation = this.prepareInvitationObject(userDetails._id, this._generalService.userId, projectDetails._id.toString(), userDetails.emailId);

      // create invitation in db
      const invitation = await this._invitationService.createInvitation(newInvitation, session);

      const invitationEmail = {
        to: [model.invitationToEmailId], subject: 'Invitation',
        message: await this.prepareInvitationEmailMessage(ProjectInvitationType.normal, projectDetails, invitation[0].id, model.invitationToEmailId)
      };

      // send email again
      this._emailService.sendMail(invitationEmail.to, invitationEmail.subject, invitationEmail.message);
      this.commitTransaction(session);
      return 'Invitation sent successfully!';
    } catch (e) {
      this.abortTransaction(session);
      throw e;
    }
  }

  async removeCollaborator(id: string, projectId: string) {
    const projectDetails: Project = await this.getProjectDetails(projectId);

    projectDetails.members = projectDetails.members.filter(f => f.userId !== id);
    return await this.updateProjectHelper(projectId, projectDetails);
  }

  /**
   * update project template
   * @param model
   */
  async updateProjectTemplate(model: ProjectTemplateUpdateModel) {
    const projectDetails: Project = await this.getProjectDetails(model.projectId);

    const invalidTemplate = !Object.values(ProjectTemplateEnum).includes(model.template);
    if (invalidTemplate) {
      throw new BadRequestException('invalid project template');
    }

    const session = await this.startSession();
    try {
      await this.updateById(model.projectId, { $set: { template: model.template } }, session);
      await this.commitTransaction(session);
      const result = await this.findById(model.projectId, projectBasicPopulation);
      return this.parseProjectToVm(result);
    } catch (e) {
      await this.abortTransaction(session);
      throw e;
    }
  }

  /**
   * update collaborator working capacity
   * @param id: project id
   * @param dto: Array of ProjectWorkingCapacityUpdateDto
   */
  async updateCollaboratorWorkingCapacity(id: string, dto: ProjectWorkingCapacityUpdateDto[]) {
    const projectDetails: Project = await this.getProjectDetails(id);

    // check if all users are part of project
    const everyBodyThere = dto.every(ddt => projectDetails.members.some(pd => {
      return pd.userId === ddt.userId && pd.isInviteAccepted;
    }));

    if (!everyBodyThere) {
      throw new BadRequestException('One of Collaborator is not found in Project!');
    }

    // valid working days
    const validWorkingDays = dto.every(ddt => validWorkingDaysChecker(ddt.workingDays));

    if (!validWorkingDays) {
      throw new BadRequestException('One of Collaborator working days are invalid');
    }

    // loop over members and set details that we got in request
    projectDetails.members = projectDetails.members.map(pd => {
      const indexInDto = dto.findIndex(f => f.userId === pd.userId);
      if (indexInDto > -1) {
        pd.workingCapacity = hourToSeconds(dto[indexInDto].workingCapacity) || DEFAULT_WORKING_CAPACITY;
        pd.workingCapacityPerDay = hourToSeconds(dto[indexInDto].workingCapacityPerDay) || DEFAULT_WORKING_CAPACITY_PER_DAY;
        pd.workingDays = dto[indexInDto].workingDays || DEFAULT_WORKING_DAYS;
      }
      return pd;
    });

    // update project
    return await this.updateProjectHelper(id, { $set: { members: projectDetails.members } });
  }

  /**
   * get all projects with pagination
   * @param model
   */
  async getAllProjects(model: GetAllProjectsModel) {
    const filter = {
      organization: model.organizationId
    };

    // populate
    model.populate = ['members.userDetails'];

    return await this.getAllPaginatedData(filter, model);
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

  /**
   * create new stage
   * @param id: string Project Id
   * @param stage: ProjectStages Stage Object
   */
  async createStage(id: string, stage: ProjectStages) {
    if (!stage || !stage.name) {
      throw new BadRequestException('Please add stage name');
    }

    // get project details
    const projectDetails: Project = await this.getProjectDetails(id);

    if (projectDetails.settings.stages) {
      const isDuplicate = projectDetails.settings.stages.some(s => s.name.toLowerCase().trim() === stage.name.toLowerCase().trim());

      if (isDuplicate) {
        throw new BadRequestException('Stage Name Already Exists');
      }
    } else {
      projectDetails.settings.stages = [];
    }

    stage.id = new Types.ObjectId().toHexString();

    // set stage sequence number from length
    stage.sequenceNumber = projectDetails.settings.stages.length + 1;

    projectDetails.settings.stages.push(stage);

    const session = await this._projectModel.db.startSession();
    session.startTransaction();

    try {
      // if project has a sprint id
      // means project have a active sprint
      if (projectDetails.sprintId) {

        // create sprint model
        const sprintStage = new SprintColumn();
        sprintStage.id = stage.id;
        sprintStage.statusId = stage.id;
        sprintStage.tasks = [];
        sprintStage.totalEstimation = 0;
        sprintStage.isHidden = false;

        // update sprint and add a stage
        await this._sprintModel.updateOne({ _id: projectDetails.sprintId }, {
          $push: { stages: sprintStage }
        }, { session });
      }

      return await this.updateProjectHelper(id, projectDetails, session);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /**
   * change sequence of stage in project stages array
   * @param model: ProjectStageSequenceChangeRequest
   */
  async changeStageSequence(model: ProjectStageSequenceChangeRequest) {
    if (!model || !model.projectId) {
      throw new BadRequestException('Project not Found');
    }

    if (!model.stageId) {
      throw new BadRequestException('Stage Not Found');
    }

    if (model.sequenceNo === undefined || model.sequenceNo === null) {
      throw new BadRequestException('Sequence no not found');
    }

    const projectDetails = await this.getProjectDetails(model.projectId);
    const existingIndex = projectDetails.settings.stages.findIndex(stage => stage.id === model.stageId);
    projectDetails.settings.stages.splice(model.sequenceNo, 0, projectDetails.settings.stages.splice(existingIndex, 1)[0]);

    projectDetails.settings.stages.forEach((stage, index) => {
      stage.sequenceNumber = index;
    });

    return await this.updateProjectHelper(model.projectId, { $set: { 'settings.stages': projectDetails.settings.stages } });
  }

  /**
   * remove stage from project
   * remove stage from active sprint if project have an active sprint
   * @param id
   * @param stageId
   * @returns {Promise<Project>}
   */
  async removeStage(id: string, stageId: string) {
    const projectDetails: Project = await this.getProjectDetails(id);

    projectDetails.settings.stages = projectDetails.settings.stages.filter(f => f.id !== stageId);

    // need to check active sprint logic here
    const session = await this.startSession();

    try {
      // means this project have an active sprint
      if (projectDetails.sprintId) {
        // get sprint details
        // remove stage from a sprint logic goes here...
      }
      return await this.updateProjectHelper(id, { $set: { 'settings.stages': projectDetails.settings.stages } }, session);
    } catch (e) {
      await this.abortTransaction(session);
      throw e;
    }
  }

  /**
   * switch project
   * @param model
   */
  async switchProject(model: SwitchProjectRequest) {
    const organizationDetails = await this.getOrganizationDetails(model.organizationId);
    const projectDetails = await this.getProjectDetails(model.projectId);

    const session = await this.startSession();

    try {
      await this._userModel.updateOne({ _id: this._generalService.userId }, {
        $set: {
          currentProject: model.projectId, currentOrganizationId: model.organizationId
        }
      }, { session });
      await this.commitTransaction(session);
      return await this._userService.getUserProfile(this._generalService.userId);
    } catch (e) {
      await this.abortTransaction(session);
      throw e;
    }
  }

  /**
   * search project
   * search by organization
   * search by one is creator of project or an active collaborator in project
   * search by name, description and template
   * @param model
   */
  async searchProject(model: SearchProjectRequest) {
    const organizationDetails = await this.getOrganizationDetails(model.organizationId);

    const query = new MongooseQueryModel();

    query.filter = {
      // organization: model.organizationId,
      isDeleted: false,
      $and: [{
        $or: [
          { createdBy: this._generalService.userId },
          { members: { $elemMatch: { userId: this._generalService.userId, isInviteAccepted: true } } }
        ]
      }, {
        $or: [
          { name: { $regex: new RegExp(model.query), $options: 'i' } },
          { description: { $regex: new RegExp(model.query), $options: 'i' } },
          { template: { $regex: new RegExp(model.query), $options: 'i' } }
        ]
      }]
    };
    query.select = 'name description template createdAt updatedAt createdById';
    query.populate = [{ path: 'createdBy', select: 'emailId userName firstName lastName profilePic -_id' }];
    query.sort = 'updatedAt';
    query.sortBy = 'desc';

    return this.find(query);

  }

  /**
   * search project tags
   * @param model
   * @returns {Promise<ProjectTags[]>}
   */
  async searchTags(model: SearchProjectTags): Promise<ProjectTags[]> {
    if (!this.isValidObjectId(model.projectId)) {
      throw new NotFoundException('Project not found');
    }

    if (typeof model.query !== 'string') {
      throw new BadRequestException('invalid search term');
    }

    const query = new MongooseQueryModel();

    query.filter = {
      _id: model.projectId
    };

    query.select = 'settings.tags';
    query.lean = true;

    // const organizationDetails = await this.getOrganizationDetails(model.organizationId);

    const project: any = await this.findOne(query);

    if (project && project.settings && project.settings.tags) {
      return project.settings.tags.filter(tag => !tag.isDeleted && tag.name.toLowerCase().includes(model.query.toLowerCase())).map(tag => tag.name);
    } else {
      return [];
    }
  }

  /**
   * search project collaborators
   * by collaborator first name, last name and email id
   * first find project then filter out project members with request search query
   * @param model: SearchProjectCollaborators
   * @return {Promise<User[]>}
   */
  async searchProjectCollaborators(model: SearchProjectCollaborators) {
    if (!this.isValidObjectId(model.projectId)) {
      throw new NotFoundException('Project not found');
    }

    if (typeof model.query !== 'string') {
      throw new BadRequestException('invalid search term');
    }

    const query = new MongooseQueryModel();

    query.filter = {
      _id: model.projectId
    };

    query.populate = [{
      path: 'members.userDetails',
      select: 'firstName lastName emailId profilePic _id isDeleted status'
    }];

    query.select = 'members';
    query.lean = true;

    const project = await this.findOne(query);
    if (project && project.members && project.members.length) {
      return project.members
        .filter(member => {
          // filter out members who are either deleted, or not accepted the invitation or not an active member
          return !member.userDetails.isDeleted && member.isInviteAccepted && member.userDetails.status === UserStatus.Active;
        })
        .filter(member => {
          // search in email id , first name or last name
          return (
            member.emailId.match(new RegExp(model.query, 'i')) ||
            member.userDetails.firstName.match(new RegExp(model.query, 'i')) ||
            member.userDetails.lastName.match(new RegExp(model.query, 'i'))
          );
        }).map(member => {
          return {
            id: member.userDetails['_id'],
            emailId: member.userDetails.emailId,
            firstName: member.userDetails.firstName,
            lastName: member.userDetails.lastName,
            profilePic: member.userDetails.profilePic
          };
        });
    } else {
      return [];
    }
  }

  /**
   * update project by id
   * @param id
   * @param project
   * @param session
   */
  async updateProjectHelper(id: string, project, session?: ClientSession) {
    if (!session) {
      session = await this.startSession();
    }

    try {
      await this.updateById(id, project, session);
      await this.commitTransaction(session);
      const result = await this.findById(id, projectBasicPopulation);
      return this.parseProjectToVm(result);
    } catch (e) {
      await this.abortTransaction(session);
      throw e;
    }
  }

  /**
   * get project details by id
   * @param id: project id
   * @param getFullDetails
   */
  public async getProjectDetails(id: string, getFullDetails: boolean = false): Promise<Project> {
    if (!this.isValidObjectId(id)) {
      throw new NotFoundException('Project not found');
    }

    const populate: any = [
      {
        path: 'createdBy',
        select: 'firstName lastName emailId'
      }, {
        path: 'organization',
        select: 'name'
      }, { path: 'settings.statuses' }, { path: 'settings.taskTypes' }, { path: 'settings.priorities' }];

    if (getFullDetails) {
      populate.push({
        path: 'activeBoard',
        select: 'name projectId columns publishedAt publishedById createdById',
        populate: {
          path: 'columns.headerStatus columns.includedStatuses.status columns.includedStatuses.defaultAssignee'
        }
      });
    }

    const projectDetails: Project = await this._projectModel.findById(id)
      .select('name members settings createdById updatedBy sprintId organizationId activeBoardId')
      .populate(populate)
      .lean().exec();

    if (!projectDetails) {
      throw new NotFoundException('Project not found');
    } else {
      if (!this._utilityService.userPartOfProject(this._generalService.userId, projectDetails)) {
        BadRequest('You are not a part of Project');
      }
    }

    projectDetails.id = projectDetails._id.toString();
    return projectDetails;
  }

  /**
   * get organization details by id
   * @param id: organization id
   */
  private async getOrganizationDetails(id: string) {
    if (!this.isValidObjectId(id)) {
      throw new NotFoundException('Organization not found');
    }
    const organizationDetails: Organization = await this._organizationModel.findById(id).select('members createdBy updatedBy').lean().exec();

    if (!organizationDetails) {
      throw new NotFoundException('Organization not Found');
    } else {
      const isMember = organizationDetails.members.some(s => s.toString() === this._generalService.userId) || (organizationDetails.createdBy as User)['_id'].toString() === this._generalService.userId;

      if (!isMember) {
        throw new BadRequestException('You are not a part of this Organization');
      }
    }
    return organizationDetails;
  }

  /**
   * is duplicate project name
   * @param model
   * @param exceptThis
   */
  private async isDuplicate(model: Project, exceptThis?: string): Promise<boolean> {
    const queryFilter = {
      organizationId: model.organizationId, name: { $regex: `^${model.name.trim()}$`, $options: 'i' }
    };

    if (exceptThis) {
      queryFilter['_id'] = { $ne: exceptThis };
    }

    const queryResult = await this.find({
      filter: queryFilter
    });

    return !!(queryResult && queryResult.length);
  }

  /**
   * create project vm model
   * @param project
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

  /**
   * create invitation in db and prepare send email array
   * @param collaborators
   * @param projectDetails
   * @param invitationType
   * @param session
   * @param emailArrays
   */
  private async createInvitation(collaborators: ProjectMembers[], projectDetails: Project, invitationType: ProjectInvitationType, session: ClientSession, emailArrays: any[]) {
    for (let i = 0; i < collaborators.length; i++) {
      const newInvitation = this.prepareInvitationObject(collaborators[i].userId, this._generalService.userId, projectDetails._id.toString(), collaborators[i].emailId);

      const invitation = await this._invitationService.createInvitation(newInvitation, session);
      emailArrays.push({
        to: [collaborators[i].emailId],
        subject: 'Invitation',
        message: await this.prepareInvitationEmailMessage(invitationType, projectDetails, invitation[0].id, collaborators[i].emailId)
      });
    }
  }

  /**
   * prepare invitation email message
   * @param type
   * @param projectDetails
   * @param invitationId
   * @param inviteEmailId
   */
  private async prepareInvitationEmailMessage(type: ProjectInvitationType, projectDetails: Project, invitationId: string, inviteEmailId?: string) {

    const linkType = type === ProjectInvitationType.signUp ? 'register' : 'dashboard';
    const link = `${environment.APP_URL}${linkType}?emailId=${inviteEmailId}&invitationId=${invitationId}`;

    const templateData = { project: projectDetails, invitationLink: link, user: projectDetails.createdBy };
    return await this._emailService.getTemplate(EmailTemplatePathEnum.projectInvitation, templateData);
  }

  /**
   * prepare invite object
   * @param to
   * @param from
   * @param projectId
   * @param toEmailId
   */
  private prepareInvitationObject(to: string, from: string, projectId: string, toEmailId: string): Invitation {
    const invitation = new Invitation();

    invitation.invitationToId = to;
    invitation.invitedById = from;
    invitation.invitationToEmailId = toEmailId;
    invitation.isExpired = false;
    invitation.isInviteAccepted = false;
    invitation.projectId = projectId;
    invitation.invitedAt = generateUtcDate();

    return invitation;
  }

}
