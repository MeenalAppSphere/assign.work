import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Task, TimeLog } from '@aavantan-app/models';
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
      loggedTime: new FormControl(null, [Validators.required]),
      remainingTime: new FormControl(null, [Validators.required])
    });
  }

  loggedTimeFormatter(value: number) {
    return `$ ${value}`
  }

  loggedTimeParse(value: string) {
    return value.replace('$ ', '');
  }

  async save() {
    console.log('Time log save clicked!');
    this.addTimelogInProcess = true;
    const timeLog: TimeLog = { ...this.timeLogForm.getRawValue() };
    timeLog.createdBy = this._generalService.user;
    const taskId = this.selectedTaskItem.id;

    try {
      await this._taskService.addTimelog(timeLog, taskId).toPromise();
      this.addTimelogInProcess = false;
    } catch (e) {
      this.addTimelogInProcess = false;
    }
    this.toggleTimeLogShow.emit();

  }

  public calcRemaining() {
    const loggedTime = this.timeLogForm.get('loggedTime').value;
    const remainingTime = this.timeLogForm.get('remainingTime').value;
    // if(loggedTime>remainingTime){
    //   this.notification.error('Error', 'Spent time is greater than Remaining time');
    //   return;
    // }
    const val = remainingTime - loggedTime;
    this.timeLogForm.get('remainingTime').patchValue(val);
  }

  handleCancel(): void {
    this.timelogModalIsVisible = false;
  }
}
