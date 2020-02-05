import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ProjectStatus } from '@aavantan-app/models';
import { UserQuery } from '../../queries/user/user.query';

@Component({
  selector: 'aavantan-board-design',
  templateUrl: './board-design.component.html',
  styleUrls: ['./board-design.component.scss']
})
export class BoardDesignComponent implements OnInit, OnDestroy {

  public boardDesignForm:FormGroup;
  public statusList: ProjectStatus[] = [];
  public stagesList: any = [];

  constructor(private FB:FormBuilder, private _userQuery: UserQuery) { }

  ngOnInit() {

    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.stagesList = res.settings.stages;
        this.statusList = res.settings.status;
      }
    })

    this.boardDesignForm = this.FB.group({
      name: new FormControl(null, [Validators.required])
    });

  }

  public saveForm() {

  }


  public ngOnDestroy(): void {
  }

}
