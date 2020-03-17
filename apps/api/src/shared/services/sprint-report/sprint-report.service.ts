import { BaseService } from '../base.service';
import { SprintReportModel } from '../../../../../../libs/models/src/lib/models/sprint-report.model';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DbCollection, Sprint, Task, TaskStatusModel } from '@aavantan-app/models';
import { ModuleRef } from '@nestjs/core';
import { SprintReportUtilityService } from './sprint-report.utility.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GeneralService } from '../general.service';
import { basicUserDetailsForAggregateQuery } from '../../helpers/aggregate.helper';
import { SprintService } from '../sprint/sprint.service';
import { ProjectService } from '../project/project.service';
import { SprintUtilityService } from '../sprint/sprint.utility.service';
import { TaskStatusService } from '../task-status/task-status.service';
import * as moment from 'moment';

@Injectable()
export class SprintReportService extends BaseService<SprintReportModel & Document> {
  private _projectService: ProjectService;
  private _taskStatusService: TaskStatusService;
  private _sprintService: SprintService;

  private _utilityService: SprintReportUtilityService;
  private _sprintUtilityService: SprintUtilityService;

  constructor(
    @InjectModel(DbCollection.sprintReports) protected readonly _sprintReportModel: Model<SprintReportModel & Document>,
    private _moduleRef: ModuleRef, private _generalService: GeneralService
  ) {
    super(_sprintReportModel);
  }

  onModuleInit(): void {
    this._projectService = this._moduleRef.get('ProjectService');
    this._sprintService = this._moduleRef.get('SprintService');
    this._taskStatusService = this._moduleRef.get('TaskStatusService');

    this._utilityService = new SprintReportUtilityService();
    this._sprintUtilityService = new SprintUtilityService();
  }

  async getReportById(sprintId: string, projectId: string) {
    // get project details
    const projectDetails = await this._projectService.getProjectDetails(projectId, true);

    // get all statuses
    const taskStatuses: TaskStatusModel[] = await this._taskStatusService.find({
      filter: { projectId }, lean: true, select: 'name _id'
    });

    // sprint details
    const sprintDetails = await this._sprintService.getSprintDetails(sprintId, projectId, [], '-columns -membersCapacity');

    let report: SprintReportModel = null;

    const result: SprintReportModel[] = await this.dbModel
      .aggregate()
      .match({ _id: this.toObjectId(sprintDetails.reportId), sprintId: this.toObjectId(sprintId), isDeleted: false })
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
      // .lookup({
      //   from: DbCollection.tasks,
      //   let: { taskId: '$reportTasks.taskId' },
      //   pipeline: [
      //     { $match: { $expr: { $eq: ['$_id', '$$taskId'] } } },
      //     { $addFields: { id: '$_id' } },
      //     { $project: { comments: 0, attachments: 0, watchers: 0, tags: 0, relatedItemId: 0, dependentItemId: 0,  } }
      //   ],
      //   as: 'reportTasks.task'
      // })
      // .unwind({ path: '$reportTasks.task', preserveNullAndEmptyArrays: true })
      .lookup({
        from: DbCollection.users,
        let: { assigneeId: '$reportTasks.assigneeId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$assigneeId'] } } },
          { $project: basicUserDetailsForAggregateQuery }
        ],
        as: 'reportTasks.assignee'
      })
      .unwind({ path: '$reportTasks.assignee', preserveNullAndEmptyArrays: true })
      // .lookup({
      //   from: DbCollection.taskStatus,
      //   let: { statusId: '$reportTasks.statusId' },
      //   pipeline: [
      //     { $match: { $expr: { $eq: ['$_id', '$$statusId'] } } },
      //     { $project: { name: 1 } }
      //   ],
      //   as: 'reportTasks.status'
      // })
      // .unwind({ path: '$reportTasks.status', preserveNullAndEmptyArrays: true })
      .lookup({
        from: DbCollection.taskPriority,
        let: { priorityId: '$reportTasks.priorityId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$priorityId'] } } },
          { $project: { name: 1, color: 1 } }
        ],
        as: 'reportTasks.priority'
      })
      .unwind({ path: '$reportTasks.priority', preserveNullAndEmptyArrays: true })
      .lookup({
        from: DbCollection.taskType,
        let: { taskTypeId: '$reportTasks.taskTypeId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$taskTypeId'] } } },
          { $project: { name: 1, color: 1 } }
        ],
        as: 'reportTasks.taskType'
      })
      .unwind({ path: '$reportTasks.taskType', preserveNullAndEmptyArrays: true })
      .group({
        _id: '$_id',
        reportMembers: { '$addToSet': '$reportMembers' },
        reportTasks: { '$addToSet': '$reportTasks' },
        sprint: { '$first': '$sprint' }
      })
      .exec();

    if (result) {
      report = result[0];
      report.id = report._id;

      report.sprint = sprintDetails;
      report.sprintDuration = `${moment(report.sprint.endAt).diff(report.sprint.startedAt, 'd')} Days`;
      this._sprintUtilityService.calculateSprintEstimates(sprintDetails);

      this._utilityService.prepareSprintReportUserProductivity(report);

      const lastColumnOfSprint = projectDetails.activeBoard.columns[projectDetails.activeBoard.columns.length - 1];
      report.finalStatusIds = lastColumnOfSprint.includedStatuses.map(status => status.statusId);
      this._utilityService.prepareSprintReportTasksCountReport(report, taskStatuses);
      return report;
    } else {
      throw new NotFoundException('Report Not Found');
    }

  }

  async createReport(sprint: Sprint, session: ClientSession) {
    const report = this._utilityService.createSprintReportModelFromSprint(sprint);
    report.createdById = this._generalService.userId;
    return await this.create([report], session);
  }

  async updateReportTask(reportId: string, task: Task, session: ClientSession) {
    // get report details
    const sprintReport: SprintReportModel = await this.getSprintReportDetails(reportId);

    // update sprint report
    // find task in sprint report
    const taskIndexInReport = sprintReport.reportTasks.findIndex(reportTask => {
      return reportTask.taskId.toString() === task.id.toString();
    });

    // get updated task form task object
    const updatedTask = this._utilityService.createSprintReportTaskFromSprintColumnTask(task);

    // update report task object
    const updateReportObject = {
      $set: {
        [`reportTasks.${taskIndexInReport}`]: updatedTask
      }
    };

    // update report by id
    return await this.updateById(reportId, updatedTask, session);
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
