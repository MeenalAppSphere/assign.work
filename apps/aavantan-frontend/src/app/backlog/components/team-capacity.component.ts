import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Organization, Sprint, User } from '@aavantan-app/models';

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

  constructor() {}

  ngOnInit() {

  }

  public saveForm(){
    this.toggleShow.emit(this.sprintData);
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
