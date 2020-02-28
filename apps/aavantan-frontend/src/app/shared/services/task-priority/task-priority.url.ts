import { createUrl } from '../apiUrls/base.url';

export const TaskPriorityUrls = {
  getAllTaskPriorities: createUrl('task-priority/get-all'),
  addTaskPriority: createUrl('task-priority/create'),
  updateTaskPriority: createUrl('task-priority/update')
};
