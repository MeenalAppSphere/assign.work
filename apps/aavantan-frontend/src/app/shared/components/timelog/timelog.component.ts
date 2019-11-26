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
    const log : TaskTimeLog = {
        taskId : this.selectedTaskItem.id,
        createdById:this.selectedTaskItem.id,
        startedAt:timeLog.loggedDate[0],
        endAt:timeLog.loggedDate[0],
        desc:timeLog.desc,
        remainingTimeReadable:timeLog.remainingHours+'h '+timeLog.remainingHours+'m',
        loggedTimeReadable:timeLog.loggedHours+'h '+timeLog.loggedMinutes+'m',
      }

      const timeLogRequest : AddTaskTimeModel = {
        projectId : this._generalService.currentProject.id,
        timeLog : log
      }

    try {
      await this._taskService.addTimelog(timeLogRequest).toPromise();
      this.addTimelogInProcess = false;
      this.toggleTimeLogShow.emit();
    } catch (e) {
      this.addTimelogInProcess = false;
      this.toggleTimeLogShow.emit();
    }

  }

  public calcRemaining() {
    const workingHoursPerDay = 3600*8; // 8 hrs in seconds

    const estimatedTimeInSeconds = 5600;  //replace with this.selectedTaskItem.estimateTime;

    const loggedHours = Number(this.timeLogForm.get('loggedHours').value);
    const loggedMinutes = Number(this.timeLogForm.get('loggedMinutes').value);

    const loggedIntoSec = this.timeConvertToSec(loggedHours, loggedMinutes);

    let remainingHours = this.timeConvert(estimatedTimeInSeconds).h;
    let remainingMinutes = this.timeConvert(estimatedTimeInSeconds).m;

    if(loggedIntoSec > workingHoursPerDay){
       this.errorMessage = 'Exceeded logging duration';
    }else{
      this.errorMessage = null;
    }

    remainingHours = remainingHours - loggedHours;
    this.timeLogForm.get('remainingHours').patchValue(remainingHours);
    remainingMinutes = remainingMinutes - loggedMinutes;
    this.timeLogForm.get('remainingMinutes').patchValue(remainingMinutes);
  }

  timeConvertToSec(h, m) {
    return (h * 60 * 60) + (m * 60);
  }
   timeConvert(n) {
    const num = n/60;
    const hours = (num / 60);
    const rhours = Math.floor(hours);
    const minutes = (hours - rhours) * 60;
    const rminutes = Math.round(minutes);
    return {
      h: rhours,
      m: rminutes
    }
  }
  handleCancel(): void {
    this.timelogModalIsVisible = false;
  }

  ngOnDestroy() {

  }

}
