import { BaseService } from '../base.service';
import { DbCollection, WorkflowModel } from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NotFoundException, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ProjectService } from '../project/project.service';
import { WorkflowUtilityService } from './workflow.utility.service';
import { GeneralService } from '../general.service';

export class WorkflowService extends BaseService<WorkflowModel & Document> implements OnModuleInit {
  private _projectService: ProjectService;
  private readonly _utilityService: WorkflowUtilityService;

  constructor(
    @InjectModel(DbCollection.workflow) protected readonly _workflowModel: Model<WorkflowModel & Document>,
    private readonly _moduleRef: ModuleRef, private _generalService: GeneralService
  ) {
    super(_workflowModel);
    this._utilityService = new WorkflowUtilityService();
  }

  onModuleInit(): any {
    this._projectService = this._moduleRef.get('ProjectService');
  }

  /**
   * add update work flow
   * get project details
   * check validations
   * if id present than update mode and if not than create
   * @param model
   */
  async addUpdateWorkflow(model: WorkflowModel) {

    return this.withRetrySession(async (session: ClientSession) => {
      // check if workflow id is present than it's update workflow existing workflow
      if (model.id) {
        // check if workflow exists or not
        await this.getWorkflowDetails(model.id);
      }

      // get project details and also check if one have project access
      const projectDetails = await this._projectService.getProjectDetails(model.projectId);

      // check validation for adding work flow
      this._utilityService.checkAddWorkflowValidation(model, projectDetails);

      const workflowModel = new WorkflowModel();
      workflowModel.name = model.name;
      workflowModel.projectId = model.projectId;
      workflowModel.statuses = this._utilityService.prepareWorkFlowStatues(model.statuses);
      workflowModel.isActive = false;
      workflowModel.createdById = this._generalService.userId;

      if (workflowModel.id) {
        // update existing workflow
        await this.updateById(workflowModel.id, workflowModel, session);
      } else {
        // create new one
        await this.create([workflowModel], session);
      }
      return `Workflow ${workflowModel.id ? 'created' : 'updated'} successfully`;
    });
  }


  async activeDeActiveWorkflow(workflowId: string, isActive: boolean) {
    // check if workflow exists or not
    const workflowDetails = await this.getWorkflowDetails(workflowId);

    if (!isActive) {

    } else {

    }
  }

  /**
   * get workflow details by id
   * @param workflowId
   */
  async getWorkflowDetails(workflowId: string): Promise<WorkflowModel> {
    if (!this.isValidObjectId(workflowId)) {
      throw new NotFoundException('Workflow not found');
    }

    return this.dbModel.findById(workflowId).lean();
  }

}
