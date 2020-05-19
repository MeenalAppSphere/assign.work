import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskService } from '../../shared/services/task/task.service';
import { GeneralService } from '../../shared/services/general.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
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
import { UserService } from '../../shared/services/user/user.service';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'aavantan-task-type',
  templateUrl: './add-task-type.component.html',
  styleUrls: ['./add-task-type.component.scss']
})
export class AddTaskTypeComponent implements OnInit, OnDestroy {
  @Input() public addTaskTypeModalIsVisible: boolean = false;
  @Input() public addEditprojectTaskTypeData: TaskTypeModel;
  @Input() public typesList: TaskTypeModel[];

  @Output() toggleAddTaskTypeShow: EventEmitter<any> = new EventEmitter<any>();

  public taskTypeForm: FormGroup;
  public updateRequestInProcess: boolean;

  // for color picker
  public showColorBox: boolean;
  public primaryColor = '#000000';

  public selectedAssignee: User = {};
  public assigneeDataSource:User[] = []
  public isSearchingAssignee:boolean;
  public assigneeModelChanged = new Subject<string>();

  constructor(protected notification: NzNotificationService,
              private _taskTypeService: TaskTypeService,
              private _projectService: ProjectService,
              private _generalService: GeneralService,
              private FB: FormBuilder,
              private _userService: UserService) {
  }

  ngOnInit() {
    this.taskTypeForm = this.FB.group({
      assigneeId: new FormControl(null, [Validators.required]),
      displayName: new FormControl(null, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      color: new FormControl("#000000" ),
      id: new FormControl(null),
      description: new FormControl(''),
      projectId: new FormControl(this._generalService.currentProject.id)
    });

    if (this.addEditprojectTaskTypeData) {
      this.primaryColor = this.addEditprojectTaskTypeData.color;
      this.taskTypeForm.get('name').patchValue(this.addEditprojectTaskTypeData.name);
      this.taskTypeForm.get('color').patchValue(this.addEditprojectTaskTypeData.color);
      this.taskTypeForm.get('displayName').patchValue(this.addEditprojectTaskTypeData.displayName);
      this.taskTypeForm.get('id').patchValue(this.addEditprojectTaskTypeData.id);
      this.taskTypeForm.get('description').patchValue(this.addEditprojectTaskTypeData.description);
      this.taskTypeForm.get('projectId').patchValue(this._generalService.currentProject.id);
    }

    // search default assignee
    this.assigneeModelChanged
      .pipe(
        debounceTime(500))
      .subscribe(() => {
        const queryText = this.taskTypeForm.get('assigneeId').value;
        const name = this.selectedAssignee.firstName + ' ' + this.selectedAssignee.lastName;
        if (!queryText || this.taskTypeForm.get('assigneeId').value === name) {
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
      this.taskTypeForm.get('assigneeId').patchValue(userName);
    }
    this.assigneeModelChanged.next();
  }

  public clearAssigeeSearchText() {
    this.taskTypeForm.get('assigneeId').patchValue('');
    this.selectedAssignee.profilePic = null;
  }

  async saveTaskType() {

    try {

      if (this.taskTypeForm.invalid) {
        this.notification.error('Error', 'Please check Display name, Color and Task type');
        return;
      }

      if (this.addEditprojectTaskTypeData && this.addEditprojectTaskTypeData.id) {

        this.updateRequestInProcess = true;
        await this._taskTypeService.updateTaskType(this.taskTypeForm.value).toPromise();
        this.updateRequestInProcess = false;
        this.toggleAddTaskTypeShow.emit();

      } else {

        const dup: TaskTypeModel[] = this.typesList.filter((ele) => {
          if (ele.color === this.taskTypeForm.value.color || ele.name === this.taskTypeForm.value.name || ele.displayName === this.taskTypeForm.value.displayName) {
            return ele;
          }
        });

        if (dup && dup.length > 0) {
          this.notification.error('Error', 'Duplicate Display Name, Color or Task type');
          return;
        }
        this.updateRequestInProcess = true;
        await this._taskTypeService.createTaskType(this.taskTypeForm.value).toPromise();
        this.taskTypeForm.reset({ projectId: this._generalService.currentProject.id });
        this.updateRequestInProcess = false;
        this.toggleAddTaskTypeShow.emit();

      }
    }catch (e) {
      this.updateRequestInProcess = false;
    }
  }

  handleCancel(): void {
    this.toggleAddTaskTypeShow.emit();
  }


  // color picker
  public toggleColor() {
    this.showColorBox = !this.showColorBox;
  }
  public clearColor() {
    this.primaryColor = '#000000';
    this.taskTypeForm.get('color').patchValue(this.primaryColor);
    this.showColorBox = !this.showColorBox;
  }
  public changeComplete($event: ColorEvent) {
    this.primaryColor = $event.color.hex;
    this.taskTypeForm.get('color').patchValue($event.color.hex);
  }

  ngOnDestroy() {

  }

}
