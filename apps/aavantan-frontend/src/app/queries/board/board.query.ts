import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { BoardState, BoardStore } from '../../store/board/board.store';

@Injectable({ providedIn: 'root' })
export class BoardQuery extends Query<BoardState> {
  boards$ = this.select(s => s.boards);
  getAllInProcess$ = this.select(s => s.getAllInProcess);

  activeBoard$ = this.select(s => s.activeBoard);
  getActiveBoardInProcess$ = this.select(s => s.getActiveBoardInProcess);

  addColumnInBoardInProcess$ = this.select(s => s.addColumnInProcess);

  mergeStatusInProcess$ = this.select(s => s.mergeStatusInProcess);
  mergeColumnInProcess$ = this.select(s => s.mergeColumnInProcess);

  showColumnStatusInProcess$ = this.select(s => s.showColumnStatusInProcess);
  hideColumnStatusInProcess$ = this.select(s => s.hideColumnStatusInProcess);

  getHiddenStatusesInProcess$ = this.select(s => s.getHiddenStatusesInProcess);
  hiddenStatuses$ = this.select(s => s.hiddenStatuses);

  addDefaultAssigneeInProcess$ = this.select(s => s.addDefaultAssigneeInProcess);

  updateBoardInProcess$ = this.select(s => s.updateBoardInProcess);

  constructor(protected store: BoardStore) {
    super(store);
  }
}
