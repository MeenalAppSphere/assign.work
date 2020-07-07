import { createUrl } from '../apiUrls/base.url';

export const SprintUrls = {
  base: createUrl('sprint'),

  addSprint: createUrl('sprint/create'),
  updateSprint: createUrl('sprint/update'),
  getSprint: createUrl('sprint/get-sprint'),

  getAllSprint: createUrl('sprint/all'),
  getAllClosedSprint: createUrl('sprint/get-closed-sprints'),

  publishSprint: createUrl('sprint/publish-sprint'),
  getUnpublishedSprint: createUrl('sprint/get-unpublished-sprint'),

  assignTaskToSprint: createUrl('sprint/assign-tasks'),
  removeTaskToSprint: createUrl('sprint/remove-tasks'),
  filterTasksInSprint: createUrl('sprint/filter-sprint-tasks'),

  moveTaskToColumn: createUrl('sprint/move-task'),
  updateWorkingCapacity: createUrl('sprint/update-working-capacity'),

  getBoardData: createUrl('sprint/get-sprint'),

  closeSprint: createUrl('sprint/close-sprint'),

  addSingleTask: createUrl('sprint/add-task'),
  removeSingleTask: createUrl('sprint/remove-task')
};
