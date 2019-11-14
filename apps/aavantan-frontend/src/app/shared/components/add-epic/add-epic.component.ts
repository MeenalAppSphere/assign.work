import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Project, ProjectMembers, Task, TaskType, TimeLog, User } from '@aavantan-app/models';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../../services/task/task.service';
import { GeneralService } from '../../services/general.service';
import { NzNotificationService } from 'ng-zorro-antd';
@Component({
  selector: 'app-add-epic',
  templateUrl: './add-epic.component.html',
  styleUrls:['./add-epic.component.scss']
})
export class AddEpicComponent implements OnInit {
  public epicForm:FormGroup;
  @Input() public epicModalIsVisible: Boolean = false;
  @Input() public taskTypeDataSource: TaskType[] = [];
  @Input() public selectedTaskType: TaskType;
  @Output() toggleEpicShow: EventEmitter<any> = new EventEmitter<any>();

  public listOfSelectedWatchers: any = [];
  public assigneeDataSource: User[] = [];
  public selectedAssignee: User = {};
  public addEpicInProcess:boolean;
  public taskId: string;

  constructor(protected notification: NzNotificationService,
              private _generalService: GeneralService,
              private _taskService:TaskService,
              private FB: FormBuilder) { }

  ngOnInit() {
    this.epicForm = this.FB.group({
      projectId: [null],
      name: [null, [Validators.required]],
      taskType: [null, [Validators.required]],
      description: [null],
      assigneeId: [null],
      watchers: [null]
    });
  }

  public selectAssigneeTypeahead(user: ProjectMembers) {
    if (user && user.emailId) {
      this.selectedAssignee = user;
      this.epicForm.get('assigneeId').patchValue(user.emailId);
    }
  }

  public selectTaskType(item: TaskType) {
    this.selectedTaskType = item;
  }

  public assignedToMe() {
    const user: ProjectMembers={
      userId:  this._generalService.user.id,
      emailId: this._generalService.user.emailId,
      userDetails: this._generalService.user
    };
    this.selectedAssignee.id=this._generalService.user.id;
    this.selectedAssignee.firstName = this._generalService.user.firstName;
    this.selectedAssignee.lastName = this._generalService.user.lastName ? this._generalService.user.lastName : null;
    this.epicForm.get('assigneeId').patchValue(this._generalService.user.firstName ? this._generalService.user.firstName : this._generalService.user.emailId);
  }

  async saveForm() {

    const task: Task = { ...this.epicForm.getRawValue() };
    task.projectId = this._generalService.currentProject.id;
    task.createdById = this._generalService.user.id;

    task.taskType = this.selectedTaskType && this.selectedTaskType.id ? this.selectedTaskType.id : null;
    task.assigneeId = this.selectedAssignee && this.selectedAssignee.id ? this.selectedAssignee.id : null;

    if (!task.name || !task.taskType) {
      this.notification.error('Error', 'Please check all mandatory fields');
      return;
    }

    this.addEpicInProcess = true;
    try {

      if (this.taskId) {
        task.id = this.taskId;
        await this._taskService.updateTask(task).toPromise();
      } else {
        await this._taskService.createTask(task).toPromise();
        this.epicForm.reset();
      }

      this.addEpicInProcess = false;
      this.toggleEpicShow.emit();
    } catch (e) {
      this.addEpicInProcess = false;
      this.toggleEpicShow.emit();
    }

  }


  handleCancel(): void {
    this.epicModalIsVisible=false;
  }
}
