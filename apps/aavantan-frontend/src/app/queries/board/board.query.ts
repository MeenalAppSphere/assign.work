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
  showHideColumnInProcess$ = this.select(s => s.showHideColumnInProcess);
  addDefaultAssigneeInProcess$ = this.select(s => s.addDefaultAssigneeInProcess);

  constructor(protected store: BoardStore) {
    super(store);
  }
}
