import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ProjectMembers } from '@aavantan-app/models';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'user-filter',
  templateUrl: './user-filter.component.html',
  styleUrls: ['./user-filter.component.scss']
})
export class UserFilterComponent implements OnInit, OnDestroy {
  //Input project members list
  @Input() public projectMembers: ProjectMembers[];
  @Input() public avatarSize:32;

  //Return project selected members id
  @Output() selectedMembers: EventEmitter<string[]> = new EventEmitter<string[]>();

  public filterMembersId:string[]=[];
  constructor() {
  }

  ngOnInit() {
    this.projectMembers = cloneDeep(this.projectMembers);
    if(this.projectMembers && this.projectMembers.length > 0) {
      this.projectMembers.forEach((ele)=>{
        ele.userDetails.isSelected = true;
        this.filterMembersId.push(ele.userId);
      })
    }
  }

  public selectMember(user: ProjectMembers) {
    const inFilter = this.filterMembersId.includes(user.userId);
    if (!inFilter) {
      user.userDetails.isSelected = true;
      this.filterMembersId.push(user.userId);
    } else {
      user.userDetails.isSelected = false;
      this.filterMembersId = this.filterMembersId.filter(assignee =>assignee !== user.userId);
    }
    //return ids array
    this.selectedMembers.emit(this.filterMembersId);
  }

  ngOnDestroy() {

  }

}
