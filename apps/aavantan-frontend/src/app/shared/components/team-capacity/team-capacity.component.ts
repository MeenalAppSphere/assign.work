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
  selector: 'aavantan-team-capacity',
  templateUrl: './team-capacity.component.html',
  styleUrls: ['./team-capacity.component.scss']
})
export class TeamCapacityComponent implements OnInit {
  @Input() public sprintData: Sprint;

  public response: any;
  public organizations: Organization[];
  public switchShow0Capacity: boolean;
  public searchUserInput: boolean;
  public allMembersList: SprintMembersCapacity[] = [];

  constructor(private _generalService: GeneralService,
              private _sprintService: SprintService) {
  }

  ngOnInit() {
    this.allMembersList = this.sprintData.membersCapacity;
  }

  public calculateTotalCapacity() {

    if (this.sprintData.membersCapacity && this.sprintData.membersCapacity.length > 0) {
      this.sprintData.membersCapacity.forEach((ele) => {

        const countSelected = ele.workingDays.filter((ele1) => {
          if (ele1.selected) {
            return ele1;
          }
        });
        ele.workingCapacity = ele.workingCapacityPerDay * countSelected.length;

      });
    }

    this.sprintData.totalCapacity = 0;

    for (let i = 0; i < this.sprintData.membersCapacity.length; i++) {
      this.sprintData.totalCapacity = Number(this.sprintData.totalCapacity) + Number(this.sprintData.membersCapacity[i].workingCapacity);
      this.sprintData.totalCapacityReadable = this.sprintData.totalCapacity ? this.sprintData.totalCapacity + 'h 0m' : '0h 0m';
    }
  }

  public onChangeSearch(value: any): void {
    this.sprintData.membersCapacity = this.allMembersList;
    if (value) {
      this.sprintData.membersCapacity = this.sprintData.membersCapacity.filter((ele) => {
        let profileName = '';

        if (ele.user && ele.user.firstName || ele.user && ele.user.lastName) {
          profileName = (ele.user.firstName + ' ' + ele.user.lastName).toLowerCase();
        }
        if (profileName.includes(value)) {
          return ele;
        }
      });
    } else {
      this.sprintData.membersCapacity = this.allMembersList;
    }
  }

  public onChangeSwitchCapacity() {
    if (this.switchShow0Capacity) {
      this.sprintData.membersCapacity = this.sprintData.membersCapacity.filter((ele) => {
        if (ele.workingCapacity <= 0) {
          return ele;
        }
      });
    } else {
      this.sprintData.membersCapacity = this.allMembersList;
    }
  }

  public selectDay(wd: ProjectWorkingDays, userRow: SprintMembersCapacity) {
    wd.selected = !wd.selected;
    const countSelected = userRow.workingDays.filter((ele) => {
      if (ele.selected) {
        return ele;
      }
    });
    userRow.workingCapacity = userRow.workingCapacityPerDay * countSelected.length;
    this.calculateTotalCapacity();
  }
}
