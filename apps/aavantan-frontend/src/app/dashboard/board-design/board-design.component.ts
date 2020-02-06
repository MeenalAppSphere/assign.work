import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ProjectStatus } from '@aavantan-app/models';
import { UserQuery } from '../../queries/user/user.query';
import { DndDropzoneDirective } from 'ngx-drag-drop';

@Component({
  selector: 'aavantan-board-design',
  templateUrl: './board-design.component.html',
  styleUrls: ['./board-design.component.scss']
})
export class BoardDesignComponent implements OnInit, AfterViewInit, OnDestroy {

  public boardDesignForm: FormGroup;
  public statusList: ProjectStatus[] = [];
  public stagesList: any = [];
  @ViewChild('columnDragged', { static: true, read: DndDropzoneDirective }) public columnDragged: DndDropzoneDirective;

  public addStatusModalIsVisible:boolean;

  constructor(private FB: FormBuilder, private _userQuery: UserQuery) {
  }

  ngOnInit() {

    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.stagesList = res.settings.stages;
        this.statusList = res.settings.status;
      }
    });

    this.boardDesignForm = this.FB.group({
      name: new FormControl(null, [Validators.required])
    });

  }

  ngAfterViewInit(): void {

  }

  public saveForm() {

  }

  public toggleAddStatusShow(item?:ProjectStatus){
    this.addStatusModalIsVisible = !this.addStatusModalIsVisible;
  }


  public ngOnDestroy(): void {
  }

}
