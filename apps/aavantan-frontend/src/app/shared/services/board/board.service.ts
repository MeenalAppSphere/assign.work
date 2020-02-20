import { BaseService } from '../base.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { catchError, map } from 'rxjs/operators';
import {
  BasePaginatedResponse,
  BaseResponseModel,
  BoardAddNewColumnModel,
  BoardAssignDefaultAssigneeToStatusModel,
  BoardHideColumnModel,
  BoardHideColumnStatus,
  BoardMergeColumnToColumn,
  BoardMergeStatusToColumn,
  BoardModel,
  BoardModelBaseRequest,
  BoardShowColumnStatus,
  GetActiveBoardRequestModel,
  GetAllBoardsRequestModel,
  TaskStatusModel
} from '@aavantan-app/models';
import { BoardUrls } from './board.url';
import { BoardState, BoardStore } from '../../../store/board/board.store';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserStore } from '../../../store/user/user.store';

@Injectable()
export class BoardService extends BaseService<BoardStore, BoardState> {
  constructor(protected notification: NzNotificationService, protected boardStore: BoardStore, private _http: HttpWrapperService,
              private _userStore: UserStore) {
    super(boardStore, notification);

    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  getAllBoards(requestModel: GetAllBoardsRequestModel): Observable<BaseResponseModel<BasePaginatedResponse<BoardModel>>> {
    this.updateState({ boards: [], getAllInProcess: true, getAllSuccess: false });
    return this._http.post(BoardUrls.getAllBoards, requestModel).pipe(
      map((res: BaseResponseModel<BasePaginatedResponse<BoardModel>>) => {
        this.updateState({ boards: res.data.items, getAllInProcess: false, getAllSuccess: true });
        return res;
      }),
      catchError((e) => {
        this.updateState({ boards: [], getAllInProcess: false, getAllSuccess: false });
        return this.handleError(e);
      })
    );
  }

  createBoard(requestModel: BoardModel) {
    this.updateState({ createBoardInProcess: true });
    return this._http.post(BoardUrls.createBoard, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ createBoardInProcess: false, activeBoard: res.data });
        this.notification.success('Success', 'Board Created Successfully');
        return res;
      }),
      catchError((e) => {
        this.updateState({ createBoardInProcess: false });
        return this.handleError(e);
      })
    );
  }

  updateBoard(requestModel: BoardModel) {
    this.updateState({ updateBoardInProcess: true });
    return this._http.post(BoardUrls.updateBoard, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ updateBoardInProcess: false });
        this.notification.success('Success', 'Board Updated Successfully');
        return res;
      }),
      catchError((e) => {
        this.updateState({ updateBoardInProcess: false });
        return this.handleError(e);
      })
    );
  }

  publishBoard(requestModel: BoardModelBaseRequest) {
    this.updateState({ publishBoardInProcess: true });
    return this._http.post(BoardUrls.createBoard, requestModel).pipe(
      map((res: BaseResponseModel<string>) => {
        this.updateState({ publishBoardInProcess: false });

        // update current project on store and set this board as a active board in project
        this._userStore.update(state => {
          return {
            ...state,
            currentProject: {
              ...state.currentProject,
              activeBoardId: requestModel.boardId
            }
          };
        });

        this.notification.success('Success', 'Board Published Successfully');
        return res;
      }),
      catchError((e) => {
        this.updateState({ publishBoardInProcess: false });
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

  setActiveBoard(board: BoardModel) {
    this.updateState({ activeBoard: board });
  }

  addColumn(requestModel: BoardAddNewColumnModel) {
    this.updateState({ addColumnInProcess: true });
    return this._http.post(BoardUrls.addColumn, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ addColumnInProcess: false, activeBoard: res.data });
        this.bordUpdatedNotification();
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
        this.bordUpdatedNotification();
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
        this.bordUpdatedNotification();
        return res;
      }),
      catchError((e) => {
        this.updateState({ mergeColumnInProcess: false });
        return this.handleError(e);
      })
    );
  }

  hideColumn(requestModel: BoardHideColumnModel) {
    this.updateState({ hideColumnInProcess: true });
    return this._http.post(BoardUrls.hideColumn, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ hideColumnInProcess: false, activeBoard: res.data });
        this.bordUpdatedNotification();
        return res;
      }),
      catchError((e) => {
        this.updateState({ hideColumnInProcess: false });
        return this.handleError(e);
      })
    );
  }

  showColumnStatus(requestModel: BoardShowColumnStatus) {
    this.updateState({ showColumnStatusInProcess: true });
    return this._http.post(BoardUrls.showColumnStatus, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {

        // update the store
        this.store.update((state: BoardState) => {
          return {
            ...state,
            showColumnStatusInProcess: false,
            activeBoard: res.data,
            hiddenStatuses: state.hiddenStatuses.filter(status => status.id !== requestModel.statusId)
          };
        });

        this.bordUpdatedNotification();
        return res;
      }),
      catchError((e) => {
        this.updateState({ showColumnStatusInProcess: false });
        return this.handleError(e);
      })
    );
  }

  hideColumnStatus(requestModel: BoardHideColumnStatus) {
    this.updateState({ hideColumnStatusInProcess: true });
    return this._http.post(BoardUrls.hideColumnStatus, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ hideColumnStatusInProcess: false, activeBoard: res.data });
        this.getAllHiddenStatuses({ projectId: requestModel.projectId, boardId: requestModel.boardId }).subscribe();
        this.bordUpdatedNotification();
        return res;
      }),
      catchError((e) => {
        this.updateState({ hideColumnStatusInProcess: false });
        return this.handleError(e);
      })
    );
  }

  getAllHiddenStatuses(requestModel: BoardModelBaseRequest) {
    this.updateState({ getHiddenStatusesInProcess: true });
    return this._http.post(BoardUrls.getAllHiddenStatus, requestModel).pipe(
      map((res: BaseResponseModel<TaskStatusModel[]>) => {
        this.updateState({ getHiddenStatusesInProcess: false, hiddenStatuses: res.data });
        this.bordUpdatedNotification();
        return res;
      }),
      catchError((e) => {
        this.updateState({ getHiddenStatusesInProcess: false, hiddenStatuses: [] });
        return this.handleError(e);
      })
    );
  }

  addDefaultAssigneeToStatus(requestModel: BoardAssignDefaultAssigneeToStatusModel) {
    this.updateState({ addDefaultAssigneeInProcess: true });
    return this._http.post(BoardUrls.addDefaultAssignee, requestModel).pipe(
      map((res: BaseResponseModel<BoardModel>) => {
        this.updateState({ addDefaultAssigneeInProcess: false, activeBoard: res.data });
        this.bordUpdatedNotification();
        return res;
      }),
      catchError((e) => {
        this.updateState({ addDefaultAssigneeInProcess: false });
        return this.handleError(e);
      })
    );
  }

  private bordUpdatedNotification() {
    this.notification.success('Success', 'Board Updated Successfully');
  }
}
