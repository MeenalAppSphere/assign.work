import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskService } from '../../shared/services/task/task.service';
import { GeneralService } from '../../shared/services/general.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ProjectMembers,
  ProjectPriority,
  SearchProjectCollaborators,
  TaskPriorityModel,
  TaskTypeModel,
  User
} from '@aavantan-app/models';
import { ProjectService } from '../../shared/services/project/project.service';
import { TaskTypeService } from '../../shared/services/task-type/task-type.service';
import { ColorEvent } from 'ngx-color';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { UserService } from '../../shared/services/user/user.service';

@Component({
  selector: 'aavantan-remove-collaborator',
  templateUrl: './remove-collaborator.component.html',
  styleUrls: ['./remove-collaborator.component.scss']
})
export class RemoveCollaboratorComponent implements OnInit, OnDestroy {
  @Input() public removeCollaboratorModalIsVisible: boolean = false;
  @Input() public collaborator: ProjectMembers;
  @Output() toggleRemoveCollaborator: EventEmitter<boolean> = new EventEmitter<boolean>();

  public removeForm: FormGroup;

  public updateRequestInProcess: boolean;
  public selectedAssignee: User = {};
  public assigneeDataSource: User[] = [];
  public isSearchingAssignee: boolean;
  public assigneeModelChanged = new Subject<string>();

  constructor(protected notification: NzNotificationService,
              private _taskTypeService: TaskTypeService,
              private _projectService: ProjectService,
              private _generalService: GeneralService,
              private _userService: UserService,
              private FB: FormBuilder) {
  }

  ngOnInit() {

    console.log(this.collaborator);
    this.removeForm = this.FB.group({
      assigneeId: new FormControl(null, [Validators.required])
    });

    // search default assignee
    this.assigneeModelChanged
      .pipe(
        debounceTime(500))
      .subscribe(() => {
        const queryText = this.removeForm.get('assigneeId').value;
        const name = this.selectedAssignee.firstName + ' ' + this.selectedAssignee.lastName;
        if (!queryText || this.removeForm.get('assigneeId').value === name) {
          return;
        }
        this.isSearchingAssignee = true;
        const json: SearchProjectCollaborators = {
          projectId: this._generalService.currentProject.id,
          query: queryText
        };
        this._userService.searchProjectCollaborator(json).subscribe((data) => {
          this.isSearchingAssignee = false;
          this.assigneeDataSource = data.data;
        });

      });
    // end default search assignee
  }

  public selectAssigneeTypeahead(user: User) {
    if (user && user.emailId) {
      this.selectedAssignee = user;
      let userName = user && user.firstName ? user.firstName : user.emailId;
      if (user && user.firstName && user && user.lastName) {
        userName = userName + ' ' + user.lastName;
      }
      this.removeForm.get('assigneeId').patchValue(userName);
    }
    this.assigneeModelChanged.next();
  }

  public clearAssigeeSearchText() {
    this.removeForm.get('assigneeId').patchValue('');
    this.selectedAssignee.profilePic = null;
  }

  async remove() {
    try {

      if (this.removeForm.invalid) {
        this.notification.error('Error', 'Please select new assignee to assign');
        return;
      }

      this.updateRequestInProcess = true;
      const json: any = {
        projectId: this._generalService.currentProject.id,
        userId: this.collaborator.userId
      };

      await this._projectService.removeCollaborators(json).toPromise();
      this.removeForm.reset();
      this.updateRequestInProcess = false;
      this.toggleRemoveCollaborator.emit();
    } catch (e) {
      this.updateRequestInProcess = false;
    }
  }

  handleCancel(): void {
    this.toggleRemoveCollaborator.emit();
  }

  ngOnDestroy() {

  }

}
