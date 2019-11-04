import { createUrl } from '../apiUrls/base.url';

export const TaskUrls = {
  base: createUrl('task'),
  update: `${createUrl('task/:taskId')}`,
  addTimelog: `${createUrl('task/addtimelog/:taskId')}`,
  addComment: `${createUrl('task/:taskId/add-comment')}`,
  updateComment: `${createUrl('task/:taskId/update-comment')}`,
  pinComment: `${createUrl('task/:commentId/pin-comment')}`,
  attachement: `${createUrl('task/add')}`,
};
