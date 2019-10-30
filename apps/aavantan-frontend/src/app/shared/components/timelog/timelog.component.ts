import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Task } from '@aavantan-app/models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-timelog',
  templateUrl: './timelog.component.html',
  styleUrls: ['./timelog.component.scss']
})
export class TimelogComponent implements OnInit {
  public dateFormat = 'MM/dd/yyyy';
  public timeLogForm:FormGroup;
  @Input() public timelogModalIsVisible: Boolean = false;
  @Input() public selectedTaskItem:Task;
  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  constructor() { }

  ngOnInit() {
    this.timeLogForm = new FormGroup({
      description:new FormControl(null, [Validators.required]),
      date: new FormControl(null, [Validators.required]),
      startTime: new FormControl(null, [Validators.required]),
      endTime: new FormControl(null, [Validators.required])
    });
  }

  handleOk(): void {
    console.log('Button ok clicked!');
    this.toggleTimeLogShow.emit();
  }

  handleCancel(): void {
    this.timelogModalIsVisible=false;
  }
}
