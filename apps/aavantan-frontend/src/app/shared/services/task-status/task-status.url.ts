import { createUrl } from '../apiUrls/base.url';

export const TaskStatusUrls = {
  getAllTaskStatuses: createUrl('task-status/get-all'),
  addTaskStatus: createUrl('task-status/create'),
  updateTaskStatus: createUrl('task-status/create')
};
