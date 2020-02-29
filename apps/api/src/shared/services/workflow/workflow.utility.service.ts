import { Project, WorkflowModel, WorkflowStatuses } from '@aavantan-app/models';
import { BadRequest, generateUtcDate } from '../../helpers/helpers';
import { ProjectUtilityService } from '../project/project.utility.service';

export class WorkflowUtilityService {
  private _projectUtilityService: ProjectUtilityService;

  constructor() {
    this._projectUtilityService = new ProjectUtilityService();
  }

  /**
   * check add work flow validations
   * @param model
   * @param projectDetails
   */
  public checkAddWorkflowValidation(model: WorkflowModel, projectDetails: Project) {
    // check if name is present
    if (!model.name) {
      BadRequest('Work flow name is required');
    }

    // check statues and statues length
    if (!model.statuses || !model.statuses.length) {
      BadRequest('No Statues selected, Please select at least one status');
    }

    // check if all status are available
    const allStatuesAvailable = model.statuses.every(status => {
      return projectDetails.settings.statuses.some(projectStatus => projectStatus.id === status.status);
    });
    if (!allStatuesAvailable) {
      BadRequest('One of the status is not found in project');
    }

    // check if duplicate status are there
    if (!this.checkDuplicationOfStatus(model.statuses)) {
      BadRequest('One of the selected status is present on multiple column!, A status can only be selected once');
    }

    // check all default assignees are part of a project
    const allAssigneesArePartOfProject = model.statuses.every(status => {
      return this._projectUtilityService.userPartOfProject(status.defaultAssigneeId, projectDetails);
    });

    if (!allAssigneesArePartOfProject) {
      BadRequest('One of default assignee is not a part of project');
    }
  }

  /**
   * check for duplicate status
   * @param statuses
   */
  public checkDuplicationOfStatus(statuses: WorkflowStatuses[]): boolean {
    const flattenStatus: string[] = statuses.map(status => {
      return status.status;
    });

    // create new set and add our array
    // so if anything is duplicate than set will remove it so we can compare array length and size
    return flattenStatus.length === new Set(flattenStatus).size;
  }

  /**
   * prepare work flow Statuses
   * returns an array which we can directly add it to database
   * @param statuses
   */
  public prepareWorkFlowStatues(statuses: WorkflowStatuses[]): WorkflowStatuses[] {
    return statuses.map(status => {
      return {
        status: status.status,
        defaultAssigneeId: status.defaultAssigneeId,
        createdById: status.createdById,
        updatedById: status.updatedById,
        createdAt: generateUtcDate(),
        updatedAt: generateUtcDate()
      } as WorkflowStatuses;
    });
  }
}
