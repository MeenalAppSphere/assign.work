import { createUrl } from '../apiUrls/base.url';

export const TaskUrls = {
  base: createUrl('task'),

  addTask: createUrl('task/add'),

  getAllTask: createUrl('task/get-all'),
  getAllBacklogTasks: createUrl('task/get-all'),
  getAllTaskWithFilter: createUrl('task/filter'),
  update: createUrl('task/update'),
  getTask: `${createUrl('task/get-task')}`,
  filterTask: `${createUrl('task/filter')}`,

  addComment: `${createUrl('task-comments/add')}`,
  getComments: `${createUrl('task-comments/get-all')}`,
  updateComment: `${createUrl('task-comments/update')}`,
  pinComment: `${createUrl('task-comments/pin-comment')}`,

  attachement: `${createUrl('attachment/task/add')}`,
  removeAttachement: `${createUrl('attachment/:id')}`,

  getHistory: `${createUrl('task-history/get-history')}`,
  addTimelog: `${createUrl('task-time-log/log')}`,
  getLogHistory: `${createUrl('task-time-log/get-log-history')}`
};
