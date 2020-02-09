import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ProjectMembers, SearchProjectCollaborators, User } from '@aavantan-app/models';
import { debounceTime } from 'rxjs/operators';
import { UserService } from '../../../shared/services/user/user.service';
import { Subject } from 'rxjs';
import { GeneralService } from '../../../shared/services/general.service';


@Component({
  selector: 'aavantan-assign-user',
  templateUrl: './assign-user.component.html',
  styleUrls: ['./assign-user.component.scss']
})
export class AssignUserComponent implements OnInit, OnDestroy {

  @Input() public assignUserModalIsVisible: boolean = false;
  @Output() toggleAssignUserModalShow: EventEmitter<any> = new EventEmitter<any>();

  public userForm: FormGroup;
  public assignRequestInProcess: boolean;
  public selectedAssignee: User = {};
  public assigneeDataSource: User[] = [];
  public modelChanged = new Subject<string>();
  public isSearching:boolean;

  constructor(protected notification: NzNotificationService,
              private _userService: UserService,
              private _generalService:GeneralService,
              private FB: FormBuilder) {
  }

  ngOnInit() {
    this.userForm = this.FB.group({
      assigneeId: new FormControl(null)
    });



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

    this.selectedAssignee.id = this._generalService.user.id;
    this.selectedAssignee.firstName = this._generalService.user.firstName;
    this.selectedAssignee.lastName = this._generalService.user.lastName ? this._generalService.user.lastName : null;

    let userName = this._generalService.user.firstName ? this._generalService.user.firstName : this._generalService.user.emailId;
    if (this._generalService.user.firstName && this._generalService.user.lastName) {
      userName = userName + ' ' + this._generalService.user.lastName;
    }
    this.userForm.get('assigneeId').patchValue(userName);

  }


  public assign(){

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
