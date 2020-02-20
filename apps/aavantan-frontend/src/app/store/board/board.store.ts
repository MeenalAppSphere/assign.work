import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { BoardModel, TaskStatusModel } from '@aavantan-app/models';

export interface BoardState {
  boards: BoardModel[];
  getAllInProcess: boolean;
  getAllSuccess: boolean;
  activeBoard: BoardModel;
  hiddenStatuses: TaskStatusModel[];

  createBoardInProcess: boolean;
  updateBoardInProcess: boolean;
  publishBoardInProcess: boolean;

  getActiveBoardInProcess: boolean;
  addColumnInProcess: boolean;
  mergeStatusInProcess: boolean;
  mergeColumnInProcess: boolean;
  showColumnStatusInProcess: boolean;
  hideColumnInProcess: boolean;
  hideColumnStatusInProcess: boolean;
  getHiddenStatusesInProcess: boolean;
  addDefaultAssigneeInProcess: boolean;
}

const initialState: BoardState = {
  boards: [],
  getAllInProcess: false,
  getAllSuccess: false,
  activeBoard: null,
  hiddenStatuses: [],

  createBoardInProcess: false,
  updateBoardInProcess: false,
  publishBoardInProcess: false,

  getActiveBoardInProcess: false,
  addColumnInProcess: false,
  mergeStatusInProcess: false,
  mergeColumnInProcess: false,
  hideColumnInProcess: false,
  showColumnStatusInProcess: false,
  hideColumnStatusInProcess: false,
  getHiddenStatusesInProcess: false,
  addDefaultAssigneeInProcess: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'board', resettable: true })
export class BoardStore extends Store<BoardState> {
  constructor() {
    super(initialState);
  }
}
