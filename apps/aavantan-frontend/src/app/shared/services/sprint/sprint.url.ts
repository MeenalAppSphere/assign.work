import { createUrl } from '../apiUrls/base.url';

export const SprintUrls = {
  base: createUrl('sprint'),
  addSprint: createUrl('sprint/create'),
  getSprint: createUrl('sprint/get-sprint'),
  getAllSprint: createUrl('sprint/all'),
  addTaskToSprint: createUrl('sprint/add-tasks'),
  moveTask: createUrl('sprint/move-task'),
  updateWorkingCapacity: createUrl('sprint/update-working-capacity'),
};
