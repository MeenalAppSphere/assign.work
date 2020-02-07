import { BaseService } from '../base.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { HttpWrapperService } from '../httpWrapper.service';
import { GeneralService } from '../general.service';
import { catchError, map } from 'rxjs/operators';
import { BaseResponseModel, BoardModel, GetActiveBoardRequestModel } from '@aavantan-app/models';
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

  // createTaskStatus(taskStatus: TaskStatusModel): Observable<BaseResponseModel<TaskStatusModel>> {
  //   this.updateState({ addNewInProcess: true, addNewSuccess: false });
  //   return this._http.post(BoardUrls.createBoard, taskStatus).pipe(
  //     map((res: BaseResponseModel<TaskStatusModel>) => {
  //
  //       this.store.update(state => {
  //         return {
  //           ...state,
  //           addNewSuccess: true,
  //           addNewInProcess: false,
  //           statuses: [...state.statuses, res.data]
  //         };
  //       });
  //
  //       this.notification.success('Success', 'Task Status Created Successfully');
  //       return res;
  //     }),
  //     catchError(err => {
  //       this.updateState({ addNewInProcess: false, addNewSuccess: false });
  //       return this.handleError(err);
  //     })
  //   );
  // }

}
