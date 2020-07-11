import { createUrl } from '../apiUrls/base.url';

export const TaskPriorityUrls = {
  getAllTaskPriorities: createUrl('task-priority/get-all'),
  addPriority: `${createUrl('task-priority/create')}`,
  updatePriority: createUrl('task-priority/update')
};
