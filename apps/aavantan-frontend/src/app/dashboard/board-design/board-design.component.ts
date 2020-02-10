import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { BoardAddNewColumnModel, BoardModel, TaskStatusModel, User } from '@aavantan-app/models';
import { UserQuery } from '../../queries/user/user.query';
import { TaskStatusQuery } from '../../queries/task-status/task-status.query';
import { BoardService } from '../../shared/services/board/board.service';
import { GeneralService } from '../../shared/services/general.service';
import { BoardQuery } from '../../queries/board/board.query';
import { DndDropEvent } from 'ngx-drag-drop/dnd-dropzone.directive';

@Component({
  selector: 'aavantan-board-design',
  templateUrl: './board-design.component.html',
  styleUrls: ['./board-design.component.scss']
})
export class BoardDesignComponent implements OnInit, AfterViewInit, OnDestroy {

  public boardDesignForm: FormGroup;
  public statusList: TaskStatusModel[] = [];
  public activeBoard: BoardModel;
  public getActiveBoardInProcess: boolean;
  public addColumnInBoardInProcess: boolean;

  public addStatusModalIsVisible: boolean;
  public assignUserModalIsVisible: boolean;

  constructor(private FB: FormBuilder, private _userQuery: UserQuery, private _taskStatusQuery: TaskStatusQuery,
              private _boardService: BoardService, private _generalService: GeneralService,
              private _boardQuery: BoardQuery) {
  }

  ngOnInit() {

    // get active board data from store
    this._boardQuery.activeBoard$.pipe(untilDestroyed(this)).subscribe(board => {
      if (board) {
        this.activeBoard = board;
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

    // get all task statuses from store
    this._taskStatusQuery.statuses$.pipe(untilDestroyed(this)).subscribe(statuses => {
      this.statusList = statuses;
    });

    this.boardDesignForm = this.FB.group({
      name: new FormControl(null, [Validators.required])
    });

    // get active board data
    this._boardService.getActiveBoard({
      projectId: this._generalService.currentProject.id,
      boardId: this._generalService.currentProject.activeBoardId
    }).subscribe();

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

  public onStatusDropped(event, index) {
    console.log(index);
  }

  public toggleAddStatusShow(item?: TaskStatusModel) {
    this.addStatusModalIsVisible = !this.addStatusModalIsVisible;
  }

  public toggleAssignUserModalShow(user?: User) {
    this.assignUserModalIsVisible = !this.assignUserModalIsVisible;
  }


  public ngOnDestroy(): void {
  }

}
