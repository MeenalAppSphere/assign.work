import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Organization, Sprint, SprintMembersCapacity, UpdateSprintMemberWorkingCapacity } from '@aavantan-app/models';
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
  public switchShow0Capacity:boolean;
  public searchUserInput:boolean;
  public allMembersList : SprintMembersCapacity[] = [];

  constructor(private _generalService : GeneralService,
              private _sprintService : SprintService) {}

  ngOnInit() {
    this.allMembersList = this.sprintData.membersCapacity;
  }

  async saveForm(){
    console.log(this.sprintData);
//return ;
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
            workingCapacityPerDayReadable: this.sprintData.membersCapacity[i].workingCapacity.toString(),
            workingCapacity: this.sprintData.membersCapacity[i].workingCapacity
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
      this.sprintData.totalCapacityReadable = this.sprintData.totalCapacity ? this.sprintData.totalCapacity+'h 0m' : '0h 0m';
    }
  }


  public onChangeSearch(value: any): void {
    this.sprintData.membersCapacity = this.allMembersList
    if(value){
      this.sprintData.membersCapacity = this.sprintData.membersCapacity.filter((ele)=>{
        let profileName = '';

        if(ele.user && ele.user.firstName || ele.user && ele.user.lastName){
          profileName = (ele.user.firstName + ' ' +ele.user.lastName).toLowerCase();
        }
        if(profileName.includes(value)) {
          return ele;
        }
      });
    }else{
      this.sprintData.membersCapacity = this.allMembersList;
    }
  }

  public onChangeSwitchCapacity(){
    if(this.switchShow0Capacity){
      this.sprintData.membersCapacity = this.sprintData.membersCapacity.filter((ele)=>{
        if(ele.workingCapacity<=0){
          return ele;
        }
      });
    }else{
      this.sprintData.membersCapacity = this.allMembersList;
    }
  }


  public basicModalHandleCancel() {
    this.toggleShow.emit();
  }
}
