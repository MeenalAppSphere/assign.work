import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { untilDestroyed } from 'ngx-take-until-destroy';
import {
  BoardAddNewColumnModel,
  BoardAssignDefaultAssigneeToStatusModel,
  BoardHideColumnStatus,
  BoardMergeColumnToColumn,
  BoardMergeStatusToColumn,
  BoardModel,
  BoardShowColumnStatus,
  TaskStatusModel
} from '@aavantan-app/models';
import { UserQuery } from '../../queries/user/user.query';
import { TaskStatusQuery } from '../../queries/task-status/task-status.query';
import { BoardService } from '../../shared/services/board/board.service';
import { GeneralService } from '../../shared/services/general.service';
import { BoardQuery } from '../../queries/board/board.query';
import { DndDropEvent } from 'ngx-drag-drop/dnd-dropzone.directive';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'aavantan-board-design',
  templateUrl: './board-design.component.html',
  styleUrls: ['./board-design.component.scss'],
  animations: [
    trigger(
      'inOutAnimation',
      [
        transition(
          ':enter',
          [
            style({ transform: 'translateX(-100%)' }),
            animate('300ms ease-in', style({ transform: 'translateX(0%)' }))
          ]
        ),
        transition(
          ':leave',
          [
            animate('300ms ease-in', style({ transform: 'translateX(-100%)' }))
          ]
        )
      ]
    )
  ]
})
export class BoardDesignComponent implements OnInit, AfterViewInit, OnDestroy {

  public boardDesignForm: FormGroup;
  public statusList: TaskStatusModel[] = [];
  public activeBoard: BoardModel;
  public getActiveBoardInProcess: boolean;
  public addColumnInBoardInProcess: boolean;

  public showColumnStatusInProcess: boolean;
  public hideColumnStatusInProcess: boolean;

  public addDefaultAssigneeInProcess: boolean;
  public mergeStatusInProcess: boolean;
  public mergeColumnInProcess: boolean;
  public defaultAssigneeColumnId: string;
  public defaultAssigneeStatusId: string;
  public getHiddenStatusesInProcess: boolean = false;
  public hiddenStatuses: TaskStatusModel[] = [];

  public addStatusModalIsVisible: boolean;
  public assignUserModalIsVisible: boolean;
  public showHiddenStatusModalIsVisible: boolean;

  public isOpenStatusSidebar: boolean = true;

  constructor(private FB: FormBuilder, private _userQuery: UserQuery, private _taskStatusQuery: TaskStatusQuery,
              private _boardService: BoardService, private _generalService: GeneralService,
              private _boardQuery: BoardQuery) {
  }

  ngOnInit() {

    // get active board data
    this._boardService.getActiveBoard({
      projectId: this._generalService.currentProject.id,
      boardId: this._generalService.currentProject.activeBoardId
    }).subscribe();

    // get all hidden statuses
    this._boardService.getAllHiddenStatuses({
      projectId: this._generalService.currentProject.id,
      boardId: this._generalService.currentProject.activeBoardId
    }).subscribe();

    this.boardDesignForm = this.FB.group({
      name: new FormControl(null, [Validators.required])
    });

    // get active board data from store
    this._boardQuery.activeBoard$.pipe(untilDestroyed(this)).subscribe(board => {
      if (board) {
        this.activeBoard = board;
        this.boardDesignForm.get('name').patchValue(this.activeBoard.name);
      }
    });

    // set get active board in process flag from store
    this._boardQuery.getActiveBoardInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.getActiveBoardInProcess = inProcess;
    });

    // add a column in process
    this._boardQuery.addColumnInBoardInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.addColumnInBoardInProcess = inProcess;
    });

    // show column in process
    this._boardQuery.showColumnStatusInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.showColumnStatusInProcess = inProcess;
    });

    // hide column in process
    this._boardQuery.hideColumnStatusInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.hideColumnStatusInProcess = inProcess;
    });

    // add default assignee in process
    this._boardQuery.addDefaultAssigneeInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.addDefaultAssigneeInProcess = inProcess;
    });

    // merge status in process
    this._boardQuery.mergeStatusInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.mergeStatusInProcess = inProcess;
    });

    // merge column in process
    this._boardQuery.mergeColumnInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.mergeColumnInProcess = inProcess;
    });

    // merge column in process
    this._boardQuery.getHiddenStatusesInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.getHiddenStatusesInProcess = inProcess;
    });

    // merge column in process
    this._boardQuery.hiddenStatuses$.pipe(untilDestroyed(this)).subscribe(list => {
      this.hiddenStatuses = list;
    });

    // get all task statuses from store
    this._taskStatusQuery.statuses$.pipe(untilDestroyed(this)).subscribe(statuses => {
      this.statusList = statuses;
    });

  }

  ngAfterViewInit(): void {

  }

  public saveForm() {

  }

  public onColumnDropped(event: DndDropEvent) {
    const addColumnRequest = new BoardAddNewColumnModel();
    addColumnRequest.columnIndex = event.index;
    addColumnRequest.projectId = this._generalService.currentProject.id;
    addColumnRequest.boardId = this.activeBoard.id;

    // column moved from here to there
    if (event.data.headerStatusId) {
      addColumnRequest.statusId = event.data.headerStatusId;
    } else {
      // new status added from left side
      addColumnRequest.statusId = event.data.id;
    }

    this._boardService.addColumn(addColumnRequest).subscribe();
  }

  public mergeRequest(event: DndDropEvent, nextColumnId: string) {
    if (event.data.headerStatusId) {
      // merge column to column
      const mergeColumnRequestModel = new BoardMergeColumnToColumn();
      mergeColumnRequestModel.projectId = this._generalService.currentProject.id;
      mergeColumnRequestModel.boardId = this.activeBoard.id;
      mergeColumnRequestModel.nextColumnId = nextColumnId;
      mergeColumnRequestModel.columnId = event.data.headerStatusId;

      this._boardService.mergeColumnToColumn(mergeColumnRequestModel).subscribe();
    } else {
      // merge status to column
      const mergeStatusRequestModel = new BoardMergeStatusToColumn();
      mergeStatusRequestModel.projectId = this._generalService.currentProject.id;
      mergeStatusRequestModel.boardId = this.activeBoard.id;
      mergeStatusRequestModel.nextColumnId = nextColumnId;
      mergeStatusRequestModel.statusId = event.data.id;

      this._boardService.mergeStatusToColumn(mergeStatusRequestModel).subscribe();
    }
  }

  public toggleAddStatusShow(item?: TaskStatusModel) {
    this.addStatusModalIsVisible = !this.addStatusModalIsVisible;
  }

  /**
   * assign a default user to status
   * @param assigneeId
   */
  public assignDefaultUser(assigneeId?: string) {
    if (assigneeId) {
      const requestModel = new BoardAssignDefaultAssigneeToStatusModel();
      requestModel.assigneeId = assigneeId;
      requestModel.boardId = this.activeBoard.id;
      requestModel.projectId = this.activeBoard.projectId;
      requestModel.columnId = this.defaultAssigneeColumnId;
      requestModel.statusId = this.defaultAssigneeStatusId;

      this._boardService.addDefaultAssigneeToStatus(requestModel).subscribe();

      this.resetDefaultAssigneePopupFlags();
    }
  }

  showDefaultAssigneeModal(columnId: string, statusId: string) {
    this.defaultAssigneeColumnId = columnId;
    this.defaultAssigneeStatusId = statusId;
    this.assignUserModalIsVisible = true;
  }

  hideDefaultAssigneeModal() {
    this.assignUserModalIsVisible = false;
  }

  public hideStatus(columnId: string, statusId: string) {
    const hideStatusRequest = new BoardHideColumnStatus();
    hideStatusRequest.boardId = this.activeBoard.id;
    hideStatusRequest.projectId = this.activeBoard.projectId;
    hideStatusRequest.columnId = columnId;
    hideStatusRequest.statusId = statusId;

    this._boardService.hideColumnStatus(hideStatusRequest).subscribe();
  }

  private resetDefaultAssigneePopupFlags() {
    this.defaultAssigneeColumnId = null;
    this.defaultAssigneeStatusId = null;
    this.hideDefaultAssigneeModal();
  }

  public showColumnStatus(statusId: string) {
    const showStatusRequest = new BoardShowColumnStatus();
    showStatusRequest.boardId = this.activeBoard.id;
    showStatusRequest.projectId = this.activeBoard.projectId;
    showStatusRequest.statusId = statusId;

    this._boardService.showColumnStatus(showStatusRequest).subscribe();
    this.toggleHiddenStatusModalShow();
  }

  public toggleHiddenStatusModalShow() {
    this.showHiddenStatusModalIsVisible = !this.showHiddenStatusModalIsVisible;
  }

  public toggleStatusSidebar() {
    this.isOpenStatusSidebar = !this.isOpenStatusSidebar;
  }

  public ngOnDestroy(): void {
  }

}
