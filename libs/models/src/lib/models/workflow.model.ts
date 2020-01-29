import { Project, ProjectStages, ProjectStatus } from './project.model';
import { User } from './user.model';

export class WorkflowModel {
  _id?: string;
  id?: string;
  name: string;
  projectId: string;
  project?: Project;
  stageId: string;
  stage?: ProjectStages;
  previousStageId: string;
  previousStage?: ProjectStages;
  defaultStatusId: string;
  defaultStatus?: ProjectStatus;
  defaultAssigneeId: string;
  defaultAssignee?: User;
  allowedStatuses: string[];
  allowedStatusesDetails?: ProjectStatus[];
  createdById: string;
  createdBy?: User;
  updatedById: string;
  updatedBy: User;
  isDeleted: boolean;
}
