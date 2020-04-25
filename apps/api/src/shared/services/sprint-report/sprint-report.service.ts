import { BaseService } from '../base.service';
import { SprintReportModel } from '../../../../../../libs/models/src/lib/models/sprint-report.model';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DbCollection, Project, Sprint, SprintStatusEnum, Task, TaskStatusModel } from '@aavantan-app/models';
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
import { BadRequest, generateUtcDate } from '../../helpers/helpers';

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

  /**
   * get report
   * @param sprintId
   * @param projectId
   */
  async getReport(sprintId: string, projectId: string) {
    // get project details
    const projectDetails = await this._projectService.getProjectDetails(projectId, true);

    // get all statuses
    const taskStatuses: TaskStatusModel[] = await this._taskStatusService.find({
      filter: { projectId }, lean: true, select: 'name _id'
    });

    // sprint details
    const sprintDetails = await this._sprintService.getSprintDetails(sprintId, projectId, [], '-columns -membersCapacity');

    let report: SprintReportModel = null;

    // get report aggregate query
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
        finalStatusIds: { '$addToSet': '$finalStatusIds' },
        sprint: { '$first': '$sprint' }
      })
      .exec();

    if (result && result[0]) {
      report = result[0];
      report.id = report._id;

      // assign sprint details to report sprint
      report.sprint = sprintDetails;

      // calculate sprint duration
      report.sprintDuration = `${moment(report.sprint.endAt).diff(report.sprint.startedAt, 'd')} Days`;

      // assign sprint status
      report.status = report.sprint.sprintStatus.status === SprintStatusEnum.inProgress ? 'In Progress' : 'Closed';

      // calculate sprint estimates
      this._sprintUtilityService.calculateSprintEstimates(sprintDetails);

      // prepare user productivity report from sprint
      this._utilityService.prepareSprintReportUserProductivity(report);

      // prepare task count report
      this._utilityService.prepareSprintReportTasksCounts(report, taskStatuses);
      return report;
    } else {
      throw new NotFoundException('Report Not Found');
    }

  }

  /**
   * create a new sprint report
   * @param sprint
   * @param project
   * @param session
   */
  async createReport(sprint: Sprint, project: Project, session: ClientSession) {

    // create report object
    const report = this._utilityService.createSprintReportModelFromSprint(sprint, project);
    report.createdById = this._generalService.userId;

    // return new created report
    return await this.create([report], session);
  }

  /**
   * update task in report
   * updates report task when a task is updated ( name changed, assign changed, etc.. )
   * @param reportId
   * @param task
   * @param session
   */
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
    return await this.updateById(reportId, updateReportObject, session);
  }

  /**
   * add a task in sprint report
   * @param reportId
   * @param task
   * @param session
   */
  async addTaskInSprintReport(reportId: string, task: Task, session: ClientSession) {
    // get report details
    const sprintReportDetails: SprintReportModel = await this.getSprintReportDetails(reportId);

    // check if task is already in report
    const alreadyInReportIndex = sprintReportDetails.reportTasks.findIndex(reportTask => {
      return reportTask.taskId.toString() === task.id.toString();
    });

    let updateDoc;

    // task is already in sprint than set deletedById and deletedAt to null
    if (alreadyInReportIndex > -1) {
      updateDoc = {
        $set: {
          [`reportTasks.${alreadyInReportIndex}.deletedById`]: null,
          [`reportTasks.${alreadyInReportIndex}.deletedAt`]: null
        }
      };
    } else {
      // create a new report task object from task
      const reportTask = this._utilityService.createSprintReportTaskFromSprintColumnTask(task);
      updateDoc = {
        $push: { reportTasks: reportTask }
      };
    }

    // update report by id
    return await this.updateById(reportId, updateDoc, session);
  }

  /**
   * remove task from report
   * @param reportId
   * @param taskId
   * @param session
   */
  async removeTaskFromReport(reportId: string, taskId: string, session: ClientSession) {
    // get report details
    const sprintReportDetails: SprintReportModel = await this.getSprintReportDetails(reportId);

    // check if task is already in report
    const taskIndexInReport = sprintReportDetails.reportTasks.findIndex(reportTask => {
      return reportTask.taskId.toString() === taskId;
    });

    // check if task is in report
    if (taskIndexInReport > -1) {
      let updateDoc;

      /**
       * check if any one have logged time in this task earlier
       * then don't remove it just mark it as deleted
       */
      if (sprintReportDetails.reportTasks[taskIndexInReport].totalLoggedTime > 0) {
        updateDoc = {
          $set: {
            [`reportTasks.${taskIndexInReport}.deletedById`]: this._generalService.userId,
            [`reportTasks.${taskIndexInReport}.deletedAt`]: generateUtcDate()
          }
        };
      } else {
        // directly remove task from report
        sprintReportDetails.reportTasks.splice(taskIndexInReport, 1);
        updateDoc = {
          $set: { reportTasks: sprintReportDetails.reportTasks }
        };
      }

      // update report by id
      return await this.updateById(reportId, updateDoc, session);
    } else {
      BadRequest('Task not found in report');
    }
  }

  /**
   * get report details by id
   * @param reportId
   */
  async getSprintReportDetails(reportId: string): Promise<SprintReportModel> {
    if (!this.isValidObjectId(reportId)) {
      throw new NotFoundException('Sprint Report not found');
    }

    // find report by id
    const sprintReportDetails = await this.findOne({
      filter: { _id: reportId }, lean: true
    });

    if (!sprintReportDetails) {
      throw new NotFoundException('Sprint Report not found');
    }

    sprintReportDetails.id = sprintReportDetails._id.toString();
    // return report
    return sprintReportDetails;
  }

  /**
   * create missing sprint reports
   */
  async createMissingReports() {
    return this.withRetrySession(async (session: ClientSession) => {
      // get all sprints where report is not generated
      const sprintsWithoutReports = await this._sprintService.find({
        filter: {
          reportId: { $in: [undefined, null] }
        },
        select: '_id projectId reportId'
      });

      // check if we have any sprints which don't have reports
      if (sprintsWithoutReports && sprintsWithoutReports.length) {
        for (const sprint of sprintsWithoutReports) {
          // get sprint details
          const sprintDetails = await this._sprintService.getSprintDetails(sprint._id, sprint.projectId);

          const projectPopulate: any = [
            {
              path: 'activeBoard',
              select: 'name projectId columns publishedAt publishedById createdById',
              populate: {
                path: 'columns.headerStatus columns.includedStatuses.status columns.includedStatuses.defaultAssignee'
              }
            }];
          const projectSelect = 'name members settings createdById updatedBy sprintId organizationId activeBoardId';

          // get project details
          const projectDetails = await this._projectService.findOne({
            filter: { _id: sprintDetails.projectId }, select: projectSelect, populate: projectPopulate, lean: true
          });

          if (projectDetails) {
            projectDetails.id = projectDetails._id;
          } else {
            BadRequest('Project not found');
          }

          // create report for the sprint
          const report = await this.createReport(sprintDetails, projectDetails, session);

          // update sprint add report id
          await this._sprintService.updateById(sprintDetails.id, { reportId: report[0].id }, session);
        }
      }

      return 'Missing Reports Generated Successfully';
    });
  }
}
