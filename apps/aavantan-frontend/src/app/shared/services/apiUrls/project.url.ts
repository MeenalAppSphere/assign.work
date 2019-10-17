import { createUrl } from './base.url';

export const ProjectUrls = {
  base: `${createUrl('project')}`,
  updateProject: `${createUrl('project/:projectId')}`,
  addCollaborators: `${createUrl('project/:projectId/add-collaborators')}`
};
