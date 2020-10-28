import { createUrl } from '../apiUrls/base.url';

export const ProjectUrls = {
  base: `${createUrl('project')}`,
  getAllProject: `${createUrl('project/get-all')}`,
  switchProject: `${createUrl('project/switch-project')}`,
  updateProject: `${createUrl('project/update')}`,
  updateTemplate: `${createUrl('project/update-template')}`,
  searchProject: `${createUrl('project/search')}`,

  addCollaborators: `${createUrl('project/:projectId/add-collaborators')}`,
  getCollaborators: `${createUrl('project/get-collaborators')}`,

  removeCollaborators: `${createUrl('project/remove-collaborator')}`,
  resendInvitation: `${createUrl('project/resend-invitation')}`,
  recallInvitation: `${createUrl('project/recall-invitation')}`,

  addStage: `${createUrl('project/:projectId/add-stage')}`,
  removeStage: `${createUrl('project/:projectId/remove-stage/:stageId')}`,

  addStatus: `${createUrl('project/:projectId/add-status')}`,
  removeStatus: `${createUrl('project/:projectId/remove-status/:statusId')}`,

  addTaskType: `${createUrl('project/:projectId/add-task-type')}`,
  removeTaskType: `${createUrl('project/:projectId/remove-task-type/:taskTypeId')}`,

  getAllPriority: `${createUrl('task-priority/get-all')}`,
  updatePriority: `${createUrl('task-priority/update')}`,
  removePriority: `${createUrl('task-priority/remove')}`,

  updateCapacity: `${createUrl('project/:projectId/update-working-capacity')}`,
  searchTags: `${createUrl('project/search-tags')}`,

  changeAccess: createUrl('project/update-collaborators-role')

};
