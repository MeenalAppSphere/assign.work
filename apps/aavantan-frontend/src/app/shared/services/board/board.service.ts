import { BaseService } from '../base.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { catchError, map } from 'rxjs/operators';
import {
  BaseResponseModel,
  BoardAddNewColumnModel,
  BoardAssignDefaultAssigneeToStatusModel,
  BoardMergeColumnToColumn,
  BoardMergeStatusToColumn,
  BoardModel,
  BoardShowHideColumn,
  GetActiveBoardRequestModel
} from '@aavantan-app/models';
import { BoardUrls } from './board.url';
import { BoardState, BoardStore } from '../../../store/board/board.store';
import { Injectable } from '@angular/core';

@Injectable()
export class BoardService extends BaseService<BoardStore, BoardState> {
  constructor(protected notification: NzNotificationService, protected boardStore: BoardStore, private _http: HttpWrapperService,
              private _generalService: GeneralService) {
    super(boardStore, notification);

    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  getAllBoards(projectId: string) {
    this.updateState({ boards: [], getAllInProcess: true, getAllSuccess: false });
    return this._http.post(BoardUrls.getAllBoards, { projectId }).pipe(
      map((res: BaseResponseModel<BoardModel[]>) => {
        this.updateState({ boards: res.data, getAllInProcess: false, getAllSuccess: true });
        return res;
      }),
      catchError((e) => {
        this.updateState({ boards: [], getAllInProcess: false, getAllSuccess: false });
        return this.handleError(e);
      })
    );
  }

  getActiveBoard(requestModel: GetActiveBoardRequestModel) {
    this.updateState({ activeBoard: null, getActiveBoardInProcess: true });
    return this._http.post(BoardUrls.getActiveBoard, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ activeBoard: res.data, getActiveBoardInProcess: false });
        return res;
      }),
      catchError((e) => {
        this.updateState({ activeBoard: null, getActiveBoardInProcess: false });
        return this.handleError(e);
      })
    );
  }

  addColumn(requestModel: BoardAddNewColumnModel) {
    this.updateState({ addColumnInProcess: true });
    return this._http.post(BoardUrls.addColumn, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ addColumnInProcess: false, activeBoard: res.data });
        return res;
      }),
      catchError((e) => {
        this.updateState({ addColumnInProcess: false });
        return this.handleError(e);
      })
    );
  }

  mergeStatusToColumn(requestModel: BoardMergeStatusToColumn) {
    this.updateState({ mergeStatusInProcess: true });
    return this._http.post(BoardUrls.mergeStatusToColumn, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ mergeStatusInProcess: false, activeBoard: res.data });
        return res;
      }),
      catchError((e) => {
        this.updateState({ mergeStatusInProcess: false });
        return this.handleError(e);
      })
    );
  }

  mergeColumnToColumn(requestModel: BoardMergeColumnToColumn) {
    this.updateState({ mergeColumnInProcess: true });
    return this._http.post(BoardUrls.mergeColumnToColumn, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ mergeColumnInProcess: false, activeBoard: res.data });
        return res;
      }),
      catchError((e) => {
        this.updateState({ mergeColumnInProcess: false });
        return this.handleError(e);
      })
    );
  }

  showHideColumn(requestModel: BoardShowHideColumn) {
    this.updateState({ showHideColumnInProcess: true });
    return this._http.post(BoardUrls.showHideColumn, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ showHideColumnInProcess: false, activeBoard: res.data });
        return res;
      }),
      catchError((e) => {
        this.updateState({ showHideColumnInProcess: false });
        return this.handleError(e);
      })
    );
  }

  addDefaultAssigneeToStatus(requestModel: BoardAssignDefaultAssigneeToStatusModel) {
    this.updateState({ addDefaultAssigneeInProcess: true });
    return this._http.post(BoardUrls.addDefaultAssignee, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ addDefaultAssigneeInProcess: false, activeBoard: res.data });
        return res;
      }),
      catchError((e) => {
        this.updateState({ addDefaultAssigneeInProcess: false });
        return this.handleError(e);
      })
    );
  }

}
