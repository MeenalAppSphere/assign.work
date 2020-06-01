import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ProjectMembers, User } from '@aavantan-app/models';

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

  }

  public selectMember(user: ProjectMembers) {
    const inFilter = this.filterMembersId.includes(user.userId);
    if (!inFilter) {
      this.filterMembersId.push(user.userId);
    } else {
      this.filterMembersId = this.filterMembersId.filter(assignee =>assignee !== user.userId);
    }
    //return ids array
    this.selectedMembers.emit(this.filterMembersId);
  }

  ngOnDestroy() {

  }

}
