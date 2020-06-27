import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  Organization,
  ProjectWorkingDays,
  Sprint, SprintDurationsModel,
  SprintMembersCapacity,
  UpdateSprintMemberWorkingCapacity
} from '@aavantan-app/models';
import { GeneralService } from '../../services/general.service';
import { SprintService } from '../../services/sprint/sprint.service';

@Component({
  selector: 'aavantan-team-capacity-model',
  templateUrl: './team-capacity.model.component.html',
  styleUrls: ['./team-capacity.model.component.scss']
})
export class TeamCapacityModelComponent implements OnInit {
  @Input() public teamCapacityModalIsVisible: boolean;
  @Input() public sprintData: Sprint;
  @Output() toggleShow: EventEmitter<SprintDurationsModel> = new EventEmitter<any>();

  public response: any;
  public organizations: Organization[];
  public isCapacityUpdateInProgress: boolean;
  public allMembersList: SprintMembersCapacity[] = [];

  constructor(private _generalService: GeneralService,
              private _sprintService: SprintService) {
  }

  ngOnInit() {
    this.allMembersList = this.sprintData.membersCapacity;
  }

  async saveForm() {

    try {
      this.isCapacityUpdateInProgress = true;
      const json: UpdateSprintMemberWorkingCapacity = {
        capacity: [],
        sprintId: this.sprintData.id,
        projectId: this._generalService.currentProject.id
      };

      if (this.sprintData.membersCapacity && this.sprintData.membersCapacity.length > 0) {
        for (let i = 0; i < this.sprintData.membersCapacity.length; i++) {
          const capacityReqObject = {
            memberId: this.sprintData.membersCapacity[i].userId.toString(),
            workingCapacityPerDayReadable: this.sprintData.membersCapacity[i].workingCapacity.toString(),
            workingCapacityPerDay: this.sprintData.membersCapacity[i].workingCapacityPerDay,
            workingCapacity: this.sprintData.membersCapacity[i].workingCapacity,
            workingDays: this.sprintData.membersCapacity[i].workingDays
          };
          json.capacity.push(capacityReqObject);
        }
      }

      const result = await this._sprintService.updateSprintWorkingCapacity(json).toPromise();
      this.isCapacityUpdateInProgress = false;
      this.toggleShow.emit(result.data);
    } catch (e) {
      this.isCapacityUpdateInProgress = false;
    }
  }

  public modelCancel() {
    this.toggleShow.emit();
  }
}
