import { createUrl } from '../apiUrls/base.url';

export const BoardUrls = {
  getAllBoards: createUrl('board/get-all'),
  getActiveBoard: createUrl('board/get-active-board'),
  createBoard: createUrl('board/create'),
  addColumn: createUrl('board/add-column'),
  mergeStatus: createUrl('board/merge-status'),
  showHideColumn: createUrl('board/show-hide-column'),
  addDefaultAssignee: createUrl('board/add-default-assignee')
};
