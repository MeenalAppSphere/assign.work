import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { SearchProjectCollaborators, User } from '@aavantan-app/models';
import { debounceTime } from 'rxjs/operators';
import { UserService } from '../../../shared/services/user/user.service';
import { Subject } from 'rxjs';
import { GeneralService } from '../../../shared/services/general.service';
import { cloneDeep, uniqBy } from 'lodash';


@Component({
  selector: 'aavantan-assign-user',
  templateUrl: './assign-user.component.html',
  styleUrls: ['./assign-user.component.scss']
})
export class AssignUserComponent implements OnInit, OnDestroy {

  @Input() public assignUserModalIsVisible: boolean = false;
  @Input() public userDetails: User;
  @Output() toggleAssignUserModalShow: EventEmitter<any> = new EventEmitter<any>();
  @Output() assignUserEvent: EventEmitter<any> = new EventEmitter<any>();

  public userForm: FormGroup;
  public assignRequestInProcess: boolean;
  public selectedAssignee: User = {};
  public currentUser: User = {};
  public assigneeDataSource: User[] = [];
  public modelChanged = new Subject<string>();
  public isSearching: boolean;

  constructor(protected notification: NzNotificationService,
              private _userService: UserService,
              private _generalService: GeneralService,
              private FB: FormBuilder) {
  }

  ngOnInit() {
    this.userForm = this.FB.group({
      assigneeId: new FormControl(null)
    });

    if(this.userDetails) {
      this.userForm.get('assigneeId').patchValue(this.userDetails.firstName +' '+this.userDetails.lastName);
      this.selectedAssignee = this.userDetails;
    }

    this.currentUser = cloneDeep(this._generalService.user);

    // search assignee
    this.modelChanged
      .pipe(
        debounceTime(500))
      .subscribe(() => {
        const queryText = this.userForm.get('assigneeId').value;
        const name = this.selectedAssignee.firstName + ' ' + this.selectedAssignee.lastName;
        if (!queryText || this.userForm.get('assigneeId').value === name) {
          return;
        }
        this.isSearching = true;
        const json: SearchProjectCollaborators = {
          projectId: this._generalService.currentProject.id,
          query: queryText
        };
        this._userService.searchProjectCollaborator(json).subscribe((data) => {
          this.isSearching = false;
          this.assigneeDataSource = data.data;
        });

      });
    // end search assignee

  }

  public assignedToMe() {

    this.selectedAssignee.id = this.currentUser.id;
    this.selectedAssignee.firstName = this.currentUser.firstName;
    this.selectedAssignee.lastName = this.currentUser.lastName ? this.currentUser.lastName : null;

    let userName = this.currentUser.firstName ? this.currentUser.firstName : this.currentUser.emailId;
    if (this.currentUser.firstName && this.currentUser.lastName) {
      userName = userName + ' ' + this.currentUser.lastName;
    }
    this.userForm.get('assigneeId').patchValue(userName);
  }

  public assign() {
    this.assignUserEvent.emit(this.selectedAssignee.id);
  }

  public selectAssigneeTypeahead(user: User) {
    if (user && user.emailId) {
      this.selectedAssignee = user;
      let userName = user && user.firstName ? user.firstName : user.emailId;
      if (user && user.firstName && user && user.lastName) {
        userName = userName + ' ' + user.lastName;
      }
      this.userForm.get('assigneeId').patchValue(userName);
    }
    this.modelChanged.next();
  }

  handleCancel(): void {
    this.toggleAssignUserModalShow.emit();
  }

  ngOnDestroy() {
  }
}
