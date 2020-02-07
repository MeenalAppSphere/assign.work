import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { BoardModel } from '@aavantan-app/models';

export interface BoardState {
  boards: BoardModel[];
  getAllInProcess: boolean;
  getAllSuccess: boolean;
  activeBoard: BoardModel;
  getActiveBoardInProcess: boolean;
}

const initialState: BoardState = {
  boards: [],
  getAllInProcess: false,
  getAllSuccess: false,
  activeBoard: null,
  getActiveBoardInProcess: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'board', resettable: true })
export class BoardStore extends Store<BoardState> {
  constructor() {
    super(initialState);
  }
}
