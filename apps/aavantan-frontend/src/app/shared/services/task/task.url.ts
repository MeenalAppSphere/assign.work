import { createUrl } from '../apiUrls/base.url';

export const TaskUrls = {
  base: createUrl('task'),
  getTask: `${createUrl('task/:displayName')}`,
  addTimelog: `${createUrl('task/addtimelog/:taskId')}`,
  addComment: `${createUrl('task/:taskId/add-comment')}`,
  getComments: `${createUrl('task/:taskId/get-comments')}`,
  getHistory: `${createUrl('task-history/:taskId')}`,
  updateComment: `${createUrl('task/:taskId/update-comment')}`,
  pinComment: `${createUrl('task/:commentId/pin-comment')}`,
  attachement: `${createUrl('task/add')}`,
};
