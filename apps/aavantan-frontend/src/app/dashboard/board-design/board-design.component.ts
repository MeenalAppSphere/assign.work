import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { TaskStatusModel } from '@aavantan-app/models';
import { UserQuery } from '../../queries/user/user.query';
import { TaskStatusQuery } from '../../queries/task-status/task-status.query';
import { BoardService } from '../../shared/services/board/board.service';

@Component({
  selector: 'aavantan-board-design',
  templateUrl: './board-design.component.html',
  styleUrls: ['./board-design.component.scss']
})
export class BoardDesignComponent implements OnInit, AfterViewInit, OnDestroy {

  public boardDesignForm: FormGroup;
  public statusList: TaskStatusModel[] = [];
  public stagesList: any = [];

  public addStatusModalIsVisible: boolean;

  constructor(private FB: FormBuilder, private _userQuery: UserQuery,
              private _taskStatusQuery: TaskStatusQuery, private _boardService: BoardService) {
  }

  ngOnInit() {

    // get all task statuses from store
    this._taskStatusQuery.statuses$.pipe(untilDestroyed(this)).subscribe(statuses => {
      this.statusList = statuses;
    });

    this.boardDesignForm = this.FB.group({
      name: new FormControl(null, [Validators.required])
    });

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
