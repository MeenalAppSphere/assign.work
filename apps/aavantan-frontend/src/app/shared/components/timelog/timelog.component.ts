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
  public todaySingleDate= null;
  public timeLogForm: FormGroup;
  public errorMessage = null;
  public workingHoursPerDay:number;
  public addTimelogInProcess: boolean;
  public isPeriod:boolean;

  @Input() public timelogModalIsVisible: Boolean = false;
  @Input() public selectedTaskItem: Task;
  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();

  constructor(protected notification: NzNotificationService, private _taskService: TaskService, private _generalService: GeneralService) {
  }

  ngOnInit() {
    this.timeLogForm = new FormGroup({
      desc: new FormControl(null, [Validators.required]),
      loggedSingleDate:new FormControl(null, [Validators.required]),
      loggedDate: new FormControl(null, []),
      loggedHours: new FormControl(null, [Validators.required]),
      loggedMinutes: new FormControl(null, [Validators.required]),
      remainingHours: new FormControl(null),
      remainingMinutes: new FormControl(null),
      isPeriod:new FormControl(null),
    });
    this.today = [new Date(), new Date()];
    this.todaySingleDate=new Date();
    this.workingHoursPerDay = 3600 * 8; // 8 hrs in seconds
    this._generalService.currentProject.members.forEach((ele)=>{
      if(ele.userId===this._generalService.user.id){
        this.workingHoursPerDay = ele.workingCapacityPerDay;
        // console.log('workingHoursPerDay',this.workingHoursPerDay);
      }
    })
  }

  async save() {
    console.log('Time log save clicked!');
    this.addTimelogInProcess = true;
    const timeLog = { ...this.timeLogForm.getRawValue() };

    // @ts-ignore
    const log: TaskTimeLog = {
      taskId: this.selectedTaskItem.id,
      createdById: this._generalService.user.id,
      desc: timeLog.desc,
      remainingTimeReadable: timeLog.remainingHours + 'h ' + timeLog.remainingMinutes + 'm',
      loggedTimeReadable: timeLog.loggedHours + 'h ' + timeLog.loggedMinutes + 'm'
    };

    if(this.isPeriod){
      log.startedAt= timeLog.loggedDate[0];
      log.endAt= timeLog.loggedDate[1];
    }else{
      log.startedAt= timeLog.loggedSingleDate;
    }

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

    const remainingTimeInSeconds = this.selectedTaskItem.remainingTime;

    const loggedHours = Number(this.timeLogForm.get('loggedHours').value);
    const loggedMinutes = Number(this.timeLogForm.get('loggedMinutes').value);

    const loggedIntoSec = this.timeConvertToSec(loggedHours, loggedMinutes);

    let remainingHours = this.timeConvert(remainingTimeInSeconds).h;
    let remainingMinutes = this.timeConvert(remainingTimeInSeconds).m;

    // handling server side
    // if (loggedIntoSec > this.workingHoursPerDay) {
    //   this.errorMessage = 'Your logging limit exceeded for Given date!';
    // } else {
    //   this.errorMessage = null;
    // }

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

  public isPeriodChanged(){
    this.today = [new Date(), new Date()];
    this.todaySingleDate=new Date();
    this.isPeriod=!this.isPeriod;
    if(this.isPeriod){
      this.timeLogForm.get('loggedSingleDate').setValidators(null);
      this.timeLogForm.get('loggedDate').setValidators([Validators.required]);
    }else{
      this.timeLogForm.get('loggedDate').setValidators(null);
      this.timeLogForm.get('loggedSingleDate').setValidators([Validators.required]);
    }
  }

  ngOnDestroy() {

  }

}
