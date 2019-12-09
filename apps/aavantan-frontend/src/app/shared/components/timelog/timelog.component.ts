import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AddTaskTimeModel, Task, TaskTimeLog } from '@aavantan-app/models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../../services/task/task.service';
import { GeneralService } from '../../services/general.service';
import { NzNotificationService } from 'ng-zorro-antd';

@Component({
  selector: 'app-timelog',
  templateUrl: './timelog.component.html',
  styleUrls: ['./timelog.component.scss']
})
export class TimelogComponent implements OnInit, OnDestroy {
  public dateFormat = 'MM/dd/yyyy';
  public today = null;
  public timeLogForm: FormGroup;
  public errorMessage = null;
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
    this.today = [new Date(), new Date()];
  }

  async save() {
    console.log('Time log save clicked!');
    this.addTimelogInProcess = true;
    const timeLog = { ...this.timeLogForm.getRawValue() };

    // @ts-ignore
    const log: TaskTimeLog = {
      taskId: this.selectedTaskItem.id,
      createdById: this._generalService.user.id,
      startedAt: timeLog.loggedDate[0],
      endAt: timeLog.loggedDate[1],
      desc: timeLog.desc,
      remainingTimeReadable: timeLog.remainingHours + 'h ' + timeLog.remainingMinutes + 'm',
      loggedTimeReadable: timeLog.loggedHours + 'h ' + timeLog.loggedMinutes + 'm'
    };

    const timeLogRequest: AddTaskTimeModel = {
      projectId: this._generalService.currentProject.id,
      timeLog: log
    };

    try {
      const data = await this._taskService.addTimelog(timeLogRequest).toPromise();
      this.addTimelogInProcess = false;
      this.toggleTimeLogShow.emit(data.data);
    } catch (e) {
      this.addTimelogInProcess = false;
      this.toggleTimeLogShow.emit();
    }

  }

  public calcRemaining() {
    const workingHoursPerDay = 3600 * 8; // 8 hrs in seconds

    const remainingTimeInSeconds = this.selectedTaskItem.remainingTime;

    const loggedHours = Number(this.timeLogForm.get('loggedHours').value);
    const loggedMinutes = Number(this.timeLogForm.get('loggedMinutes').value);

    const loggedIntoSec = this.timeConvertToSec(loggedHours, loggedMinutes);

    let remainingHours = this.timeConvert(remainingTimeInSeconds).h;
    let remainingMinutes = this.timeConvert(remainingTimeInSeconds).m;

    if (loggedIntoSec > workingHoursPerDay) {
      this.errorMessage = 'Exceeded daily logging duration';
    } else {
      this.errorMessage = null;
    }


    remainingHours = remainingHours - loggedHours;
    remainingMinutes = remainingMinutes - loggedMinutes;
    const remainingIntoSec = this.timeConvertToSec(remainingHours, remainingMinutes);

    this.timeLogForm.get('remainingHours').patchValue(this.timeConvert(remainingIntoSec).h);
    this.timeLogForm.get('remainingMinutes').patchValue(this.timeConvert(remainingIntoSec).m);
  }

  public timeConvertToSec(h, m) {
    return (h * 60 * 60) + (m * 60);
  }

  public timeConvert(seconds: number) {
    const num = seconds / 60;
    const hours = (num / 60);
    const rhours = Math.floor(hours);
    const minutes = (hours - rhours) * 60;
    const rminutes = Math.round(minutes);
    return {
      h: rhours,
      m: rminutes
    };
  }

  handleCancel(): void {
    this.timelogModalIsVisible = false;
  }

  ngOnDestroy() {

  }

}
