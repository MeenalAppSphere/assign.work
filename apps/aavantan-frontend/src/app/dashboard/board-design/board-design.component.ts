import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { BoardModel, TaskStatusModel } from '@aavantan-app/models';
import { UserQuery } from '../../queries/user/user.query';
import { TaskStatusQuery } from '../../queries/task-status/task-status.query';
import { BoardService } from '../../shared/services/board/board.service';
import { GeneralService } from '../../shared/services/general.service';
import { BoardQuery } from '../../queries/board/board.query';

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

  public addStatusModalIsVisible: boolean;

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

  public toggleAddStatusShow(item?: TaskStatusModel) {
    this.addStatusModalIsVisible = !this.addStatusModalIsVisible;
  }


  public ngOnDestroy(): void {
  }

}
