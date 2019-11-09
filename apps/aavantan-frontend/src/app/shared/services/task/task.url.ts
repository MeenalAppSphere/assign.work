import { createUrl } from '../apiUrls/base.url';

export const TaskUrls = {
  base: createUrl('task'),
  getAllTask: createUrl('task/get-all'),
  update: createUrl('task'),
  getTask: `${createUrl('task/:displayName')}`,
  filterTask: `${createUrl('task/filter')}`,
  addTimelog: `${createUrl('task/addtimelog/:taskId')}`,
  addComment: `${createUrl('task/:taskId/add-comment')}`,
  getComments: `${createUrl('task/get-comments')}`,
  getHistory: `${createUrl('task-history')}`,
  updateComment: `${createUrl('task/update-comment')}`,
  pinComment: `${createUrl('task/pin-comment')}`,
  attachement: `${createUrl('task/add')}`,
};
