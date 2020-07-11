import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { untilDestroyed } from 'ngx-take-until-destroy';
import {
  BoardAddNewColumnModel,
  BoardAssignDefaultAssigneeToStatusModel,
  BoardHideColumnModel,
  BoardHideColumnStatus,
  BoardMergeColumnToColumn,
  BoardMergeStatusToColumn,
  BoardModel,
  BoardShowColumnStatus, SaveAndPublishBoardModel,
  TaskStatusModel,
  User, UserRoleModel
} from '@aavantan-app/models';
import { UserQuery } from '../../queries/user/user.query';
import { TaskStatusQuery } from '../../queries/task-status/task-status.query';
import { BoardService } from '../../shared/services/board/board.service';
import { GeneralService } from '../../shared/services/general.service';
import { BoardQuery } from '../../queries/board/board.query';
import { DndDropEvent } from 'ngx-drag-drop/dnd-dropzone.directive';
import { animate, style, transition, trigger } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd';
import { NgxPermissionsService } from 'ngx-permissions';

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

export class BoardDesignComponent implements OnInit, OnDestroy {

  public boardId: string;
  public boardDesignForm: FormGroup;
  public activeBoard: BoardModel;
  public getActiveBoardInProcess: boolean;
  public addColumnInBoardInProcess: boolean;

  public showColumnStatusInProcess: boolean;
  public hideColumnStatusInProcess: boolean;

  public hideColumnInProcess: boolean;

  public updateBoardInProcess: boolean;
  public createBoardInProcess: boolean;

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

  public assignUserDetails: User;

  // for permission
  public havePermissionsToModify:boolean;
  public havePermissionsToAdd:boolean;
  public showActionButtons:boolean;
  public permisssions:any;

  constructor(private FB: FormBuilder, private _userQuery: UserQuery, private _taskStatusQuery: TaskStatusQuery,
              private _boardService: BoardService, private _generalService: GeneralService, private _boardQuery: BoardQuery,
              private _activatedRoute: ActivatedRoute, private modal: NzModalService,
              private permissionsService : NgxPermissionsService, private router: Router) {
  }

  ngOnInit() {
    // Get all access which is loaded from dashboard component from userRoles
    this.permissionsService.permissions$.subscribe((permission) => {
      this.permisssions = permission;
      if (!permission['canView_settingsMenu']) { // redirect to no-access page if there is no ant setting access
        this.router.navigate(['dashboard', 'no-access']);
      }else {

        this.boardId = this._activatedRoute.snapshot.params['boardId'];
        if (this.boardId) {
          // get board data by board id
          this._boardService.getActiveBoard({
            projectId: this._generalService.currentProject.id,
            boardId: this.boardId
          }).subscribe();
        } else {
          // set active board as null because we want to create a new board
          this._boardService.setActiveBoard(null);
        }

      }

      this.havePermissionsToModify = !!this.permisssions['canModifyBoardSettings_board'];
      this.havePermissionsToAdd = !!this.permisssions['canAddBoardSettings_board'];

      // if board id and modify permission both then show Save buttons
      this.showActionButtons = !(this.havePermissionsToAdd && !this.havePermissionsToModify && this.boardId);

    })

    this.boardDesignForm = this.FB.group({
      name: new FormControl(null, [Validators.required]),
      projectId: new FormControl(this._generalService.currentProject.id),
      id: new FormControl()
    });

    // get active board data from store
    this._boardQuery.activeBoard$.pipe(untilDestroyed(this)).subscribe(board => {
      if (board) {
        this.activeBoard = board;
        this.boardDesignForm.get('name').patchValue(this.activeBoard.name);
        this.boardDesignForm.get('projectId').patchValue(this.activeBoard.projectId);
        this.boardDesignForm.get('id').patchValue(this.activeBoard.id);
      }
    });

    // set update board in process flag from store
    this._boardQuery.createBoardInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.createBoardInProcess = inProcess;
    });

    // set buttons state board in success activeBoard data from store
    this._boardQuery.activeBoard$.pipe(untilDestroyed(this)).subscribe(activeBoard => {
      if (activeBoard) {
        this.boardId = activeBoard.id;
        this.havePermissionsToModify = !!this.permisssions['canModifyBoardSettings_board'];
        this.havePermissionsToAdd = !!this.permisssions['canAddBoardSettings_board'];
        // if board id and modify permission both then show Save buttons
        this.showActionButtons = !(this.havePermissionsToAdd && !this.havePermissionsToModify && this.boardId);
      }
    })

    // set update board in process flag from store
    this._boardQuery.updateBoardInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.updateBoardInProcess = inProcess;
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

    // hide column in process
    this._boardQuery.hideColumnInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.hideColumnInProcess = inProcess;
    });

    // merge column in process
    this._boardQuery.hiddenStatuses$.pipe(untilDestroyed(this)).subscribe(list => {
      this.hiddenStatuses = list;
    });

  }

  public saveForm() {
    const board = this.boardDesignForm.getRawValue();

    if (board.id) {
      this._boardService.updateBoard(board).subscribe();
    } else {
      this._boardService.createBoard(board).subscribe();
    }
  }

  public saveAndPublish() {
    const request = new SaveAndPublishBoardModel();
    request.boardId = this.activeBoard.id;
    request.projectId = this._generalService.currentProject.id;

    request.board = new BoardModel();
    request.board.name = this.boardDesignForm.get('name').value;

    try {
      this.modal.confirm({
        nzTitle: 'Do You really want to Publish this Board?',
        nzContent: '',
        nzOnOk: () =>
          new Promise(async (resolve, reject) => {
            await this._boardService.publishBoard(request).toPromise();
            resolve();
          }).catch(() => console.log('Oops errors!'))
      });
    } catch (e) {
      console.log(e);
    }
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

  showDefaultAssigneeModal(columnId: string, statusId: string, user?: User) {
    this.assignUserDetails = user;
    this.defaultAssigneeColumnId = columnId;
    this.defaultAssigneeStatusId = statusId;
    this.assignUserModalIsVisible = true;
  }

  hideDefaultAssigneeModal() {
    this.assignUserModalIsVisible = false;
  }

  public hideColumn(columnId: string) {

    this.modal.confirm({
      nzTitle: 'Do you want to remove this?',
      nzContent: '',
      nzOnOk: () =>
        new Promise((resolve, reject) => {

          const hideColumnRequest = new BoardHideColumnModel();
          hideColumnRequest.columnId = columnId;
          hideColumnRequest.boardId = this.activeBoard.id;
          hideColumnRequest.projectId = this.activeBoard.projectId;

          this._boardService.hideColumn(hideColumnRequest).subscribe();

          setTimeout(Math.random() > 0.5 ? resolve : reject, 10);

        }).catch(() => console.log('Oops errors!'))
    });


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
