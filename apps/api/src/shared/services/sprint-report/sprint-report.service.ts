import { BaseService } from '../base.service';
import { SprintReportModel } from '../../../../../../libs/models/src/lib/models/sprint-report.model';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DbCollection, Sprint, Task } from '@aavantan-app/models';
import { ModuleRef } from '@nestjs/core';
import { SprintReportUtilityService } from './sprint-report.utility.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GeneralService } from '../general.service';
import { BadRequest } from '../../helpers/helpers';
import { basicUserDetailsForAggregateQuery } from '../../helpers/aggregate.helper';

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

  async getReportById(reportId: string, sprintId: string) {
    if (!reportId) {
      BadRequest('Report not found');
    }

    if (!sprintId) {
      BadRequest('Sprint not found');
    }

    let report: SprintReportModel =  null;

    const result: SprintReportModel[] = await this.dbModel
      .aggregate()
      .match({ _id: this.toObjectId(reportId), sprintId: this.toObjectId(sprintId), isDeleted: false })
      .lookup({
        from: DbCollection.sprint,
        let: { sprintId: '$sprintId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$sprintId'] } } },
          { $addFields: { id: '$_id' } },
          { $project: { 'columns': 0, 'membersCapacity': 0 } }
        ],
        as: 'sprint'
      })
      .unwind({ path: '$sprint', preserveNullAndEmptyArrays: true })
      .unwind('reportMembers')
      .lookup({
        from: DbCollection.users,
        let: { userId: '$reportMembers.userId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
          { $project: basicUserDetailsForAggregateQuery },
          { $addFields: { id: '$_id' } }
        ],
        as: 'reportMembers.user'
      })
      .unwind({ path: '$reportMembers.user', preserveNullAndEmptyArrays: true })
      .unwind('reportTasks')
      .lookup({
        from: DbCollection.tasks,
        let: { taskId: '$reportTasks.taskId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$taskId'] } } },
          { $addFields: { id: '$_id' } }
        ],
        as: 'reportTasks.task'
      })
      .unwind({ path: '$reportTasks.task', preserveNullAndEmptyArrays: true })
      .group({
        _id: '$_id',
        reportMembers: { '$addToSet': '$reportMembers' },
        reportTasks: { '$addToSet': '$reportTasks' },
        sprint: { '$first': '$sprint' }
      })
      .exec();

    if (result) {
      report = result[0];
      report.allTasks = this._utilityService.prepareSprintReportTasksCountReport(report.reportTasks);
      report.reportMembers = this._utilityService.prepareSprintReportUserProductivity(report.reportMembers, report.sprint);
    }

    return report;
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
      const reportTask = this._utilityService.createSprintReportTaskFromSprintColumnTask(task);
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
