import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Task, TaskTimeLog } from '@aavantan-app/models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../../services/task/task.service';
import { GeneralService } from '../../services/general.service';
import { NzNotificationService } from 'ng-zorro-antd';

@Component({
  selector: 'app-timelog',
  templateUrl: './timelog.component.html',
  styleUrls: ['./timelog.component.scss']
})
export class TimelogComponent implements OnInit {
  public dateFormat = 'MM/dd/yyyy';
  public timeLogForm: FormGroup;
  @Input() public timelogModalIsVisible: Boolean = false;
  @Input() public selectedTaskItem: Task;
  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();


  public addTimelogInProcess: boolean;

  constructor(protected notification: NzNotificationService, private _taskService: TaskService, private _generalService: GeneralService) {
  }

  ngOnInit() {
    this.timeLogForm = new FormGroup({
      desc: new FormControl(null, [Validators.required]),
      loggedDate: new FormControl(null, [Validators.required]),
      loggedHours: new FormControl(null, [Validators.required]),
      loggedMinutes: new FormControl(null, [Validators.required]),
      remainingHours: new FormControl(null),
      remainingMinutes: new FormControl(null)
    });
  }

  async save() {
    console.log('Time log save clicked!');
    this.addTimelogInProcess = true;
    const timeLog = { ...this.timeLogForm.getRawValue() };

    // @ts-ignore
    const timeLogRequest : TaskTimeLog = {
        taskId : this.selectedTaskItem.id,
        createdById:this.selectedTaskItem.id,
        startedAt:timeLog.loggedDate[0],
        endAt:timeLog.loggedDate[0],
        desc:timeLog.desc,
        remainingTimeReadable:timeLog.loggedHours,
        loggedTimeReadable:timeLog.loggedHours,
      }

    try {
      await this._taskService.addTimelog(timeLogRequest, this.selectedTaskItem.id).toPromise();
      this.addTimelogInProcess = false;
    } catch (e) {
      this.addTimelogInProcess = false;
    }
    this.toggleTimeLogShow.emit();

  }

  public calcRemaining() {
    const loggedHours = this.timeLogForm.get('loggedHours').value;
    const loggedMinutes = this.timeLogForm.get('loggedMinutes').value;
    let remainingHours = this.selectedTaskItem.estimateTime;
    let remainingMinutes = this.selectedTaskItem.estimateTime;

    remainingHours = remainingHours - loggedHours;
    this.timeLogForm.get('remainingHours').patchValue(remainingHours);
    remainingMinutes = remainingMinutes - loggedMinutes;
    this.timeLogForm.get('remainingMinutes').patchValue(remainingMinutes);
  }

  handleCancel(): void {
    this.timelogModalIsVisible = false;
  }
}
