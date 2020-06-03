import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  AppFilterStorageKeysEnum,
  BackLogStorageFilterModel,
  ProjectMembers,
} from '@aavantan-app/models';
import { cloneDeep } from 'lodash';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserQuery } from '../../../queries/user/user.query';
import { GeneralService } from '../../services/general.service';

@Component({
  selector: 'user-filter',
  templateUrl: './user-filter.component.html',
  styleUrls: ['./user-filter.component.scss']
})
export class UserFilterComponent implements OnInit, OnDestroy {
  public projectMembers: ProjectMembers[];
  @Input() public avatarSize: number = 32;

  //Return project selected members id
  @Output() selectedMembers: EventEmitter<string[]> = new EventEmitter<string[]>();

  public isAssigneeFilterApplied: boolean = false;
  public filterMembersId: string[] = [];
  private currentProjectId: string;

  constructor(private _userQuery: UserQuery, private _generalService: GeneralService) {
  }

  ngOnInit() {

    // listen for current project
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      this.currentProjectId = res.id;
      this.projectMembers = cloneDeep(res.members.filter(ele => ele.isInviteAccepted));

      if (this.projectMembers && this.projectMembers.length > 0) {

        // get sprint filter from local storage
        let availableFilter: any = this._generalService.getAppFilter(res.id, AppFilterStorageKeysEnum.backLogFilter);

        if (availableFilter) {
          availableFilter = availableFilter as BackLogStorageFilterModel;

          this.projectMembers = this.projectMembers.map((member) => {
            member.userDetails.isSelected = availableFilter.assigneeIds.includes(member.userId);

            if (member.userDetails.isSelected) {
              this.filterMembersId.push(member.userId);
            }
            return member;
          });

          this.isAssigneeFilterApplied = !!(availableFilter.assigneeIds.length ||
            (availableFilter.statusIds ? availableFilter.statusIds.length : false));
        }

        //return ids array
        this.emitSelectedAssignees();
      }

    });

  }

  // select particular member
  public selectMember(user: ProjectMembers) {

    const inFilter = this.filterMembersId.includes(user.userId);
    if (!inFilter) {
      user.userDetails.isSelected = true;
      this.filterMembersId.push(user.userId);
    } else {
      user.userDetails.isSelected = false;
      this.filterMembersId = this.filterMembersId.filter(assignee => assignee !== user.userId);
    }

    //return ids array
    this.emitSelectedAssignees();
  }

  // clear filter
  public clearAssigneeFilter() {
    if (this.projectMembers && this.projectMembers.length > 0) {
      this.projectMembers.forEach((ele) => {
        ele.userDetails.isSelected = false;
      });
      this.filterMembersId = [];
      this.isAssigneeFilterApplied = false;

      //return ids array
      this.emitSelectedAssignees();
    }
  }

  // emits ids array
  private emitSelectedAssignees() {
    this._generalService.setAppFilter(this.currentProjectId, {
      backLogFilter: {
        assigneeIds: this.filterMembersId
      }
    });
    if(this.filterMembersId && this.filterMembersId.length>0){
      this.isAssigneeFilterApplied = true;
    }
    this.selectedMembers.emit(this.filterMembersId);
  }

  ngOnDestroy() {

  }

}
