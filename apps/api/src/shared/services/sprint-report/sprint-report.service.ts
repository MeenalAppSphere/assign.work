import { BaseService } from '../base.service';
import { SprintReportModel } from '../../../../../../libs/models/src/lib/models/sprint-report.model';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DbCollection, Sprint, Task } from '@aavantan-app/models';
import { ModuleRef } from '@nestjs/core';
import { SprintReportUtilityService } from './sprint-report.utility.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GeneralService } from '../general.service';

@Injectable()
export class SprintReportService extends BaseService<SprintReportModel & Document> {
  private _utilityService: SprintReportUtilityService;

  constructor(
    @InjectModel(DbCollection.sprintReports) protected readonly _sprintReportModel: Model<SprintReportModel & Document>,
    private _moduleRef: ModuleRef, private _generalService: GeneralService
  ) {
    super(_sprintReportModel);
  }

  onModuleInit(): void {
    this._utilityService = new SprintReportUtilityService();
  }

  async createReport(sprint: Sprint, session: ClientSession) {
    const report = this._utilityService.createSprintReportModelFromSprint(sprint);
    report.createdById = this._generalService.userId;
    return await this.create([report], session);
  }

  async addTaskInSprintReport(reportId: string, task: Task, session: ClientSession) {
    const sprintReportDetails: SprintReportModel = await this.getSprintReportDetails(reportId);

    const alreadyInReportIndex = sprintReportDetails.reportTasks.findIndex(reportTask => {
      return reportTask.taskId.toString() === task.id.toString();
    });

    let updateDoc;

    if (alreadyInReportIndex > -1) {
      updateDoc = {
        $set: {
          [`reportTasks.${alreadyInReportIndex}.deletedById`]: null,
          [`reportTasks.${alreadyInReportIndex}.deletedAt`]: null
        }
      };
    } else {
      const reportTask = this._utilityService.prepareSprintReportTaskFromSprintColumnTask(task);
      updateDoc = {
        $push: { reportTasks: reportTask }
      };
    }

    return await this.updateById(reportId, updateDoc, session);
  }

  async getSprintReportDetails(reportId: string): Promise<SprintReportModel> {
    if (!this.isValidObjectId(reportId)) {
      throw new NotFoundException('Sprint Report not found');
    }

    const sprintReportDetails = await this.findOne({
      filter: { _id: reportId }, lean: true
    });

    if (!sprintReportDetails) {
      throw new NotFoundException('Sprint Report not found');
    }
    sprintReportDetails.id = sprintReportDetails._id.toString();

    return sprintReportDetails;
  }
}
