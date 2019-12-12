import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import { CreateSprintModel, DbCollection, Project, Sprint, SprintStage, User } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralService } from './general.service';
import * as moment from 'moment';

@Injectable()
export class SprintService extends BaseService<Sprint & Document> {
  constructor(
    @InjectModel(DbCollection.sprint) protected readonly _sprintModel: Model<Sprint & Document>,
    @InjectModel(DbCollection.projects) private readonly _projectModel: Model<Project & Document>,
    private _generalService: GeneralService
  ) {
    super(_sprintModel);
  }

  public async createSprint(model: CreateSprintModel) {

    // region validations

    if (!model || !model.projectId) {
      throw new BadRequestException('invalid request');
    }

    if (!model.sprint.name) {
      throw new BadRequestException('Sprint Name is compulsory');
    }

    if (!model.sprint.startedAt) {
      throw new BadRequestException('Please select Sprint Start Date');
    }

    if (!model.sprint.endAt) {
      throw new BadRequestException('Please select Sprint Start Date');
    }

    const isStartDateBeforeToday = moment(model.sprint.startedAt).isBefore(moment());
    if (isStartDateBeforeToday) {
      throw new BadRequestException('Sprint Started date can not be Before Today');
    }

    const isEndDateBeforeTaskStartDate = moment(model.sprint.endAt).isBefore(model.sprint.startedAt);
    if (isEndDateBeforeTaskStartDate) {
      throw new BadRequestException('Sprint End Date can not be before Sprint Start Date');
    }

    // endregion

    // get project details and check if current user is member of project
    const projectDetails = await this.getProjectDetails(model.projectId);

    // create stages array for sprint from project
    projectDetails.settings.stages.forEach(stage => {
      const sprintStage = new SprintStage();
      sprintStage.id = stage.id;
      sprintStage.status = [];
      sprintStage.tasks = [];
      model.sprint.stages.push(sprintStage);
    });


    const session = await this._sprintModel.db.startSession();
    session.startTransaction();

    try {
      return await this.create([model], session);
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /**
   * get project details by id
   * @param id: project id
   */
  private async getProjectDetails(id: string): Promise<Project> {
    const projectDetails: Project = await this._projectModel.findById(id).select('members settings createdBy updatedBy').lean().exec();

    if (!projectDetails) {
      throw new NotFoundException('No Project Found');
    } else {
      const isMember = projectDetails.members.some(s => s.userId === this._generalService.userId) || (projectDetails.createdBy as User)['_id'].toString() === this._generalService.userId;

      if (!isMember) {
        throw new BadRequestException('You are not a part of Project');
      }
    }
    return projectDetails;
  }
}
