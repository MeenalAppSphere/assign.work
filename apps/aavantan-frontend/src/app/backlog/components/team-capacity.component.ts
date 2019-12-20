import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Organization, Sprint, UpdateSprintMemberWorkingCapacity, User } from '@aavantan-app/models';
import { GeneralService } from '../../shared/services/general.service';
import { SprintService } from '../../shared/services/sprint/sprint.service';

@Component({
  selector: 'aavantan-team-capacity',
  templateUrl: './team-capacity.component.html',
  styleUrls: ['./team-capacity.component.scss']
})
export class TeamCapacityComponent implements OnInit {
  @Input() public teamCapacityModalIsVisible: boolean;
  @Input() public sprintData: Sprint;
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();
  public response: any;
  public organizations: Organization[];
  public isCapacityUpdateInProgress : boolean;

  constructor(private _generalService : GeneralService,
              private _sprintService : SprintService) {}

  ngOnInit() {

  }

  async saveForm(){
    console.log(this.sprintData);

    try {
      this.isCapacityUpdateInProgress = true;
      const json: UpdateSprintMemberWorkingCapacity = {
        capacity: [],
        sprintId: this.sprintData.id,
        projectId: this._generalService.currentProject.id
      }

      if (this.sprintData.membersCapacity && this.sprintData.membersCapacity.length > 0) {
        for (let i = 0; i < this.sprintData.membersCapacity.length; i++) {
          const capacityReqObject = {
            memberId: this.sprintData.membersCapacity[i].userId,
            workingCapacityPerDayReadable: this.sprintData.membersCapacity[i].workingCapacity.toString()
          }
          json.capacity.push(capacityReqObject);
        }
      }

      await this._sprintService.updateSprintWorkingCapacity(json).toPromise();
      this.isCapacityUpdateInProgress = false;
      this.toggleShow.emit(this.sprintData);

    }catch (e) {
      this.isCapacityUpdateInProgress = false;
    }
  }
  public calculateTotalCapacity(){
    for(let i=0; i<this.sprintData.membersCapacity.length;i++){
      this.sprintData.totalCapacity = this.sprintData.membersCapacity[i].workingCapacity;
      this.sprintData.totalCapacityReadable = this.sprintData.totalCapacity.toString();
    }
  }

  public basicModalHandleCancel() {
    this.toggleShow.emit();
  }
}
