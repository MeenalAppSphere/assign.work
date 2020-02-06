import { createUrl } from '../apiUrls/base.url';

export const TaskTypeUrls = {
  getAllTaskTypes: createUrl('task-type/get-all'),
  addTaskType: createUrl('task-type/create'),
  updateTaskType: createUrl('task-type/update')
};
