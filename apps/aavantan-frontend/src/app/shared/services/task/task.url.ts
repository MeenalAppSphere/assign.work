import { createUrl } from '../apiUrls/base.url';

export const TaskUrls = {
  base: createUrl('task'),
  getAllTask: createUrl('task/:projectId'),
  update: createUrl('task/:taskId'),
  getTask: `${createUrl('task/:displayName')}`,
  addTimelog: `${createUrl('task/addtimelog/:taskId')}`,
  addComment: `${createUrl('task/:taskId/add-comment')}`,
  getComments: `${createUrl('task/:taskId/get-comments')}`,
  getHistory: `${createUrl('task-history/:taskId')}`,
  updateComment: `${createUrl('task/:taskId/update-comment')}`,
  pinComment: `${createUrl('task/:taskId/pin-comment')}`,
  attachement: `${createUrl('task/add')}`,
};
