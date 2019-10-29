import { createUrl } from '../apiUrls/base.url';

export const ProjectUrls = {
  base: `${createUrl('project')}`,
  updateProject: `${createUrl('project/:projectId')}`,
  addCollaborators: `${createUrl('project/:projectId/add-collaborators')}`,
  addStage: `${createUrl('project/:projectId/add-stage')}`,
  removeStage: `${createUrl('project/:projectId/remove-stage/:stageId')}`,
  addTaskType: `${createUrl('project/:projectId/add-task-type')}`,
  addPriority: `${createUrl('project/:projectId/add-priority')}`,
  removeTaskType: `${createUrl('project/:projectId/remove-task-type/:taskTypeId')}`
};
