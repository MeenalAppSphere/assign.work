import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BaseRequestModel,
  DbCollection,
  MongooseQueryModel,
  Organization,
  Project,
  ProjectMembers,
  ProjectPriority,
  ProjectStages,
  ProjectStageSequenceChangeRequest,
  ProjectStatus,
  ProjectTags,
  ProjectWorkingCapacityUpdateDto,
  SearchProjectCollaborators,
  SearchProjectRequest,
  SearchProjectTags,
  SwitchProjectRequest,
  TaskType,
  User,
  UserStatus
} from '@aavantan-app/models';
import { Document, Model, Types } from 'mongoose';
import { BaseService } from './base.service';
import { UsersService } from './users.service';
import { GeneralService } from './general.service';
import {
  DEFAULT_WORKING_CAPACITY,
  DEFAULT_WORKING_CAPACITY_PER_DAY,
  DEFAULT_WORKING_DAYS
} from '../helpers/defaultValueConstant';
import { hourToSeconds, secondsToHours, validWorkingDaysChecker } from '../helpers/helpers';

const projectBasicPopulation = [{
  path: 'members.userDetails',
  select: 'firstName lastName emailId userName profilePic'
}];

@Injectable()
export class ProjectService extends BaseService<Project & Document> {
  constructor(
    @InjectModel(DbCollection.projects) protected readonly _projectModel: Model<Project & Document>,
    @InjectModel(DbCollection.users) private readonly _userModel: Model<User & Document>,
    @InjectModel(DbCollection.organizations) private readonly _organizationModel: Model<Organization & Document>,
    @Inject(forwardRef(() => UsersService)) private readonly _userService: UsersService,
    private readonly _generalService: GeneralService
  ) {
    super(_projectModel);
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
    const session = await this._projectModel.db.startSession();
    session.startTransaction();

    const userDetails = await this._userService.findById(model.createdBy as string);

    // validations
    if (model.name && !model.name.trim()) {
      throw new BadRequestException('Please Enter Project Name');
    }

    if (!model.organization || !Types.ObjectId.isValid(model.organization as string)) {
      throw new BadRequestException('Please Choose An Organization');
    }

    model = new this._projectModel(model);
    model.organization = this.toObjectId(model.organization as string);
    model.settings.taskTypes = [];
    model.settings.priorities = [];
    model.settings.stages = [];
    model.settings.status = [];
    model.settings.tags = [];

    // add project creator as project collaborator when new project is created
    model.members.push({
      userId: userDetails.id,
      emailId: userDetails.emailId,
      isEmailSent: true,
      isInviteAccepted: true,
      workingCapacity: DEFAULT_WORKING_CAPACITY,
      workingCapacityPerDay: DEFAULT_WORKING_CAPACITY_PER_DAY,
      workingDays: DEFAULT_WORKING_DAYS
    });

    try {
      // create project and get project id from them
      const createdProject = await this.create([model], session);

      // if user is creating first project then mark it as current project
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

  /**
   * update project by id
   * @param id
   * @param project
   */
  async updateProject(id: string, project) {
    const session = await this._projectModel.db.startSession();
    session.startTransaction();

    try {
      await this.update(id, project, session);
      await session.commitTransaction();
      session.endSession();
      const result = await this.findById(id, projectBasicPopulation);
      return this.parseProjectToVm(result);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /**
   * add collaborator to project
   * separate registered and unregistered collaborators
   * create users in db from unregistered collaborators
   * send project invitation to registered and unregistered collaborators
   * @param id
   * @param members
   */
  async addCollaborators(id: string, members: ProjectMembers[]) {
    const session = await this._projectModel.db.startSession();
    session.startTransaction();

    const projectDetails: Project = await this.getProjectDetails(id);

    if (!Array.isArray(members)) {
      throw new BadRequestException('Please check provided json');
    }

    const alreadyRegisteredMembers: ProjectMembers[] = [];
    const unRegisteredMembers: ProjectMembers[] = [];
    const unregisteredMembersModel: Partial<User>[] = [];
    let finalCollaborators: ProjectMembers[] = [];

    try {
      // separate registered collaborators and unregister collaborators
      members.forEach(member => {
        // if user id is available then user is registered in database but not a collaborator in project
        if (member.userId) {
          const inProject = projectDetails.members.some(s => s.userId === member.userId);
          if (!inProject) {
            alreadyRegisteredMembers.push(member);
          }
        } else {
          unRegisteredMembers.push(member);
        }
      });

      /**
       * special case when one have created a project and added one collaborator who is not part of our system,
       * so, we create an user and add it to project member array with inviteAccepted false
       * now if some one creates a new project and search for that user who is added as collaborator for project one but he/she
       * not accepted project joining invitation, then we need to check the status of that user if it's active then mark him/her
       * active user and invite accepted for now
       */
      // loop over already registered collaborators and check if there's status is active
      // if active then consider them as invited accepted otherwise keep invited accepted as false
      for (let i = 0; i < alreadyRegisteredMembers.length; i++) {
        const userDetails = await this._userModel.findOne({
          _id: alreadyRegisteredMembers[i].userId,
          status: UserStatus.Active
        }).lean();
        alreadyRegisteredMembers[i].isEmailSent = !!userDetails;
        alreadyRegisteredMembers[i].isInviteAccepted = !!userDetails;
      }

      // push already registered collaborators to final collaborators array
      finalCollaborators = [...alreadyRegisteredMembers];

      // loop over unregistered collaborators and create users model for saving in user db
      unRegisteredMembers.forEach(f => {
        unregisteredMembersModel.push(
          new this._userModel({
            emailId: f.emailId,
            username: f.emailId
          })
        );
      });

      // check if there any unregistered users
      if (unRegisteredMembers.length) {
        // create users in database
        const createdUsers: any = await this._userService.createUser(unregisteredMembersModel, session);

        // push to final collaborators array
        finalCollaborators.push(...createdUsers.map(m => {
          return {
            userId: m.id,
            emailId: m.emailId,
            isEmailSent: false,
            isInviteAccepted: false
          };
        }));
      }

      // add members default working capacity
      const membersModel: ProjectMembers[] = finalCollaborators.map(member => {
        member.workingCapacity = DEFAULT_WORKING_CAPACITY;
        member.workingCapacityPerDay = DEFAULT_WORKING_CAPACITY_PER_DAY;
        member.workingDays = DEFAULT_WORKING_DAYS;
        return member;
      });

      await this.update(id, { members: [...projectDetails.members, ...membersModel] }, session);
      await session.commitTransaction();
      session.endSession();
      const result = await this.findById(id, projectBasicPopulation);
      return this.parseProjectToVm(result);
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
        pd.workingCapacity = hourToSeconds(dto[indexInDto].workingCapacity || DEFAULT_WORKING_CAPACITY);
        pd.workingCapacityPerDay = hourToSeconds(dto[indexInDto].workingCapacityPerDay || DEFAULT_WORKING_CAPACITY_PER_DAY);
        pd.workingDays = dto[indexInDto].workingDays || DEFAULT_WORKING_DAYS;
      }
      return pd;
    });

    // update project
    return await this.updateProject(id, { $set: { members: projectDetails.members } });
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

  /**
   * create new stage
   * @param id: string Project Id
   * @param stage: ProjectStages Stage Object
   */
  async createStage(id: string, stage: ProjectStages) {
    if (!stage || !stage.name) {
      throw new BadRequestException('Please add stage name');
    }

    const projectDetails: Project = await this.getProjectDetails(id);

    if (projectDetails.settings.stages) {
      const isDuplicate = projectDetails.settings.stages.some(s => s.name.toLowerCase() === stage.name.toLowerCase());

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
    return await this.updateProject(id, projectDetails);
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

    return await this.updateProject(model.projectId, projectDetails);
  }

  async removeStage(id: string, stageId: string) {
    const projectDetails: Project = await this.getProjectDetails(id);

    projectDetails.settings.stages = projectDetails.settings.stages.filter(f => f.id !== stageId);
    return await this.updateProject(id, projectDetails);
  }

  /**
   * create task type
   * @param id: string project id
   * @param taskType: TaskType TaskType request Model
   */
  async createTaskType(id: string, taskType: TaskType) {
    if (!taskType || !taskType.name) {
      throw new BadRequestException('Please add Task Type name');
    }

    if (!taskType.color) {
      throw new BadRequestException('Please choose color');
    }

    const projectDetails: Project = await this.getProjectDetails(id);

    if (projectDetails.settings.taskTypes && projectDetails.settings.taskTypes.length) {
      const isDuplicateName = projectDetails.settings.taskTypes.some(s => s.name.toLowerCase() === taskType.name.toLowerCase());
      const isDuplicateColor = projectDetails.settings.taskTypes.some(s => s.color.toLowerCase() === taskType.color.toLowerCase());

      if (isDuplicateName) {
        throw new BadRequestException('Tasktype Name Already Exists...');
      }

      if (isDuplicateColor) {
        throw new BadRequestException('Tasktype Color Already Exists...');
      }
    } else {
      projectDetails.settings.taskTypes = [];
    }

    taskType.id = new Types.ObjectId().toHexString();
    // projectDetails.settings.taskTypes.push(taskType);
    return await this.updateProject(id, { $push: { 'settings.taskTypes': taskType } });
  }

  async removeTaskType(id: string, taskTypeId: string) {
    const projectDetails: Project = await this.getProjectDetails(id);

    projectDetails.settings.taskTypes = projectDetails.settings.taskTypes.filter(f => f.id !== taskTypeId);
    return await this.updateProject(id, projectDetails);
  }

  /**
   * create project status
   * @param id: string Project Id
   * @param status: ProjectStatus Project Status Model
   */
  async createStatus(id: string, status: ProjectStatus) {

    if (!status.name) {
      throw new BadRequestException('Please add Status name');
    }

    const projectDetails: Project = await this.getProjectDetails(id);

    if (projectDetails.settings.status && projectDetails.settings.status.length) {
      const isDuplicate = projectDetails.settings.status.some(s => s.name.toLowerCase() === status.name.toLowerCase());

      if (isDuplicate) {
        throw new BadRequestException('Status Name Already Exists');
      }
    } else {
      projectDetails.settings.status = [];
    }

    status.id = new Types.ObjectId().toHexString();
    projectDetails.settings.status.push(status);
    return await this.updateProject(id, projectDetails);
  }

  async removeStatus(id: string, statusId: string) {
    const projectDetails: Project = await this.getProjectDetails(id);

    projectDetails.settings.status = projectDetails.settings.status.filter(f => f.id !== statusId);
    return await this.updateProject(id, projectDetails);
  }

  /**
   * create project priority
   * @param id: string project id
   * @param priority: ProjectPriority Project Priority Model
   */
  async createPriority(id: string, priority: ProjectPriority) {
    if (!priority || !priority.name) {
      throw new BadRequestException('Please add name');
    }

    if (!priority.color) {
      throw new BadRequestException('Please select color');
    }

    const projectDetails: Project = await this.getProjectDetails(id);

    if (projectDetails.settings.priorities) {
      const isDuplicate = projectDetails.settings.priorities.some(s => s.name.toLowerCase() === priority.name.toLowerCase());

      if (isDuplicate) {
        throw new BadRequestException('Priority Name Already Exists');
      }
    } else {
      projectDetails.settings.priorities = [];
    }

    priority.id = new Types.ObjectId().toHexString();
    projectDetails.settings.priorities.push(priority);
    return await this.updateProject(id, projectDetails);
  }

  async removePriority(id: string, priorityId: string) {
    const projectDetails: Project = await this.getProjectDetails(id);

    projectDetails.settings.priorities = projectDetails.settings.priorities.filter(f => f.id !== priorityId);
    return await this.updateProject(id, projectDetails);
  }

  async switchProject(model: SwitchProjectRequest) {
    const organizationDetails = await this.getOrganizationDetails(model.organizationId);
    const projectDetails = await this.getProjectDetails(model.projectId);

    const session = await this._projectModel.db.startSession();
    session.startTransaction();

    try {
      await this._userModel.updateOne({ _id: this._generalService.userId }, { currentProject: model.projectId }, session);
      const result = await this._userService.getUserProfile(this._generalService.userId);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async searchProject(model: SearchProjectRequest) {
    const organizationDetails = await this.getOrganizationDetails(model.organizationId);

    return this._projectModel.find({
      organization: model.organizationId,
      createdBy: this._generalService.userId,
      $or: [
        { name: { $regex: new RegExp(model.query), $options: 'i' } },
        { description: { $regex: new RegExp(model.query), $options: 'i' } },
        { template: { $regex: new RegExp(model.query), $options: 'i' } }
      ]
    })
      .select('name description template createdAt updatedAt')
      .populate({ path: 'createdBy', select: 'emailId userName firstName lastName profilePic -_id' });

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
   * get project details by id
   * @param id: project id
   */
  private async getProjectDetails(id: string): Promise<Project> {
    if (!this.isValidObjectId(id)) {
      throw new NotFoundException('Project not found');
    }

    const projectDetails: Project = await this._projectModel.findById(id).select('members settings createdBy updatedBy').lean().exec();

    if (!projectDetails) {
      throw new NotFoundException('Project not found');
    } else {
      const isMember = projectDetails.members.some(s => s.userId === this._generalService.userId) || (projectDetails.createdBy as User)['_id'].toString() === this._generalService.userId;

      if (!isMember) {
        throw new BadRequestException('You are not a part of Project');
      }
    }
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
      const isMember = organizationDetails.members.some(s => s.userId === this._generalService.userId) || (organizationDetails.createdBy as User)['_id'].toString() === this._generalService.userId;

      if (!isMember) {
        throw new BadRequestException('You are not a part of thi Organization');
      }
    }
    return organizationDetails;
  }

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
