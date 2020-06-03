import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ProjectMembers } from '@aavantan-app/models';
import { cloneDeep } from 'lodash';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserQuery } from '../../../queries/user/user.query';

@Component({
  selector: 'user-filter',
  templateUrl: './user-filter.component.html',
  styleUrls: ['./user-filter.component.scss']
})
export class UserFilterComponent implements OnInit, OnDestroy {
  //Input project members list
  public projectMembers: ProjectMembers[];
  @Input() public avatarSize:32;

  //Return project selected members id
  @Output() selectedMembers: EventEmitter<string[]> = new EventEmitter<string[]>();

  public isAssigneeFilterApplied: boolean = false;
  public filterMembersId:string[]=[];
  constructor(private _userQuery:UserQuery) {
  }

  ngOnInit() {

    // listen for current project
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      this.projectMembers = cloneDeep(res.members.filter(ele => ele.isInviteAccepted));

      if(this.projectMembers && this.projectMembers.length > 0) {
        this.projectMembers.forEach((ele)=> {
          ele.userDetails.isSelected = true;
          this.filterMembersId.push(ele.userId);
        })
      }

    });

  }

  // select particular member
  public selectMember(user: ProjectMembers) {

    if(this.isAssigneeFilterApplied) {
      const inFilter = this.filterMembersId.includes(user.userId);
      if (!inFilter) {
        user.userDetails.isSelected = true;
        this.filterMembersId.push(user.userId);
      } else {
        user.userDetails.isSelected = false;
        this.filterMembersId = this.filterMembersId.filter(assignee =>assignee !== user.userId);
      }
    } else {
        this.filterMembersId = [];
        this.projectMembers.forEach((ele) => {
          ele.userDetails.isSelected = false;
        })
        user.userDetails.isSelected = true;
        this.filterMembersId.push(user.userId);
        this.isAssigneeFilterApplied = true;
    }

    //return ids array
    this.selectedMembers.emit(this.filterMembersId);
  }

  // filter toggle button clear and show all
  public toggleAssigneFilter() {

    if (this.projectMembers && this.projectMembers.length > 0) {
      this.filterMembersId = [];
      if (this.isAssigneeFilterApplied) {
        this.projectMembers.forEach((ele) => {
          ele.userDetails.isSelected = true;
          this.filterMembersId.push(ele.userId);
        })
      } else {
        this.projectMembers.forEach((ele) => {
          ele.userDetails.isSelected = false;
        })
      }
      this.isAssigneeFilterApplied = !this.isAssigneeFilterApplied;
      //return ids array
      this.selectedMembers.emit(this.filterMembersId);
    }
  }

  ngOnDestroy() {

  }

}
