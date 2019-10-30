import { createUrl } from '../apiUrls/base.url';

export const TaskUrls = {
  base: createUrl('task'),
  update: `${createUrl('task/:taskId')}`,
  addTimelog: `${createUrl('task/addtimelog/:taskId')}`,
};
