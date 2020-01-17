import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CloseSprintModel, ProjectStages, ProjectStatus, Sprint } from '@aavantan-app/models';
import { GeneralService } from '../../../shared/services/general.service';
import { SprintService } from '../../../shared/services/sprint/sprint.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserQuery } from '../../../queries/user/user.query';

@Component({
  selector: 'app-close-sprint',
  templateUrl: './modal-close-sprint.component.html',
  styleUrls: ['./modal-close-sprint.component.scss']
})
export class CloseSprintComponent implements OnInit, OnDestroy {
  @Input() public closeSprintModalIsVisible;
  @Input() public activeSprintData;
  @Input() public boardData;

  @Output() toggleCloseSprintShow: EventEmitter<Sprint> = new EventEmitter<Sprint>();

  public selectedStage: ProjectStages;
  public stagesDataSource: ProjectStages[] = [];
  public sprintCloseInProcess:boolean;

  constructor(private _generalService: GeneralService,
              private _sprintService: SprintService,
              private _userQuery:UserQuery,
              protected notification: NzNotificationService) { }

  ngOnInit() {
    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.stagesDataSource = res.settings.stages;
      }
    })
  }


  public selectStage(item: ProjectStatus) {
    this.selectedStage = item;
  }

  async closeSprint(){

    try{

      this.sprintCloseInProcess = true;
      const json :CloseSprintModel ={
        projectId: this._generalService.currentProject.id,
        sprintId: this._generalService.currentProject.sprintId,
      }

      const data = await this._sprintService.closeSprint(json).toPromise();
      console.log('Sprint close', data);
      this.toggleCloseSprintShow.emit(data.data);
      this.sprintCloseInProcess = false;

    }catch (e) {
      this.sprintCloseInProcess = false;
    }

  }

  handleCancel(): void {
    this.toggleCloseSprintShow.emit();
  }

  ngOnDestroy() {

  }
}

