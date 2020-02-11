import { createUrl } from '../apiUrls/base.url';

export const BoardUrls = {
  getAllBoards: createUrl('board/get-all'),
  getActiveBoard: createUrl('board/get-active-board'),
  createBoard: createUrl('board/create'),
  updateBoard: createUrl('board/update'),
  addColumn: createUrl('board/add-column'),
  mergeStatusToColumn: createUrl('board/merge-status-to-column'),
  mergeColumnToColumn: createUrl('board/merge-column-to-column'),
  showColumnStatus: createUrl('board/show-column-status'),
  hideColumnStatus: createUrl('board/hide-column-status'),
  getAllHiddenStatus: createUrl('board/get-hidden-statuses'),
  addDefaultAssignee: createUrl('board/add-default-assignee')
};
