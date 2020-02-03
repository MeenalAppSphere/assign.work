import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskService } from '../../shared/services/task/task.service';
import { GeneralService } from '../../shared/services/general.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ProjectPriority, ProjectStatus } from '@aavantan-app/models';
import { ProjectService } from '../../shared/services/project/project.service';

@Component({
  selector: 'aavantan-add-priority',
  templateUrl: './add-priority.component.html',
  styleUrls: ['./add-priority.component.scss']
})
export class AddPriorityComponent implements OnInit, OnDestroy {
  @Input() public addPriorityModalIsVisible: boolean = false;
  @Input() public addEditprojectPriorityData:ProjectPriority;
  @Input() public priorityList:ProjectPriority[];

  @Output() toggleAddPriorityShow: EventEmitter<any> = new EventEmitter<any>();

  public priorityForm: FormGroup;
  public updateRequestInProcess:boolean;

  constructor(protected notification: NzNotificationService,
              private _taskService: TaskService,
              private _projectService:ProjectService,
              private _generalService: GeneralService,
              private FB: FormBuilder) {
  }

  ngOnInit() {
    this.priorityForm = this.FB.group({
      name: new FormControl(null, [Validators.required]),
      color: new FormControl(null, [Validators.required]),
      id: new FormControl(null)
    });

    if(this.addEditprojectPriorityData){
      this.priorityForm.get('name').patchValue(this.addEditprojectPriorityData.name);
      this.priorityForm.get('color').patchValue(this.addEditprojectPriorityData.color);
      this.priorityForm.get('id').patchValue(this.addEditprojectPriorityData.id);
    }
  }

  public savePriority() {
    if (this.priorityForm.invalid) {
      this.notification.error('Error', 'Please check Color and Priority');
      return;
    }

    this.updateRequestInProcess = true;

    if(this.addEditprojectPriorityData && this.addEditprojectPriorityData.id){

      console.log('Updated Priority :', this.priorityForm.value);
      this.updateRequestInProcess = false;
      this.toggleAddPriorityShow.emit();

    } else {

      const dup: ProjectPriority[] = this.priorityList.filter((ele) => {
        if (ele.color === this.priorityForm.value.color || ele.name === this.priorityForm.value.name) {
          return ele;
        }
      });

      if (dup && dup.length > 0) {
        this.notification.error('Error', 'Duplicate color or name');
        return;
      }

      this._projectService.addPriority(this._generalService.currentProject.id, this.priorityForm.value).subscribe((res => {

        this.priorityForm.reset();
        this.updateRequestInProcess = false;
        this.toggleAddPriorityShow.emit();

      }), (error => {
        this.updateRequestInProcess = false;
      }));
    }
  }

  handleCancel(): void {
    this.toggleAddPriorityShow.emit();
  }

  ngOnDestroy() {

  }

}
