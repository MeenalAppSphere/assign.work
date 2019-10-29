import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Task } from '@aavantan-app/models';
@Component({
  selector: 'app-timelog',
  templateUrl: './timelog.component.html',
  styleUrls: ['./timelog.component.scss']
})
export class TimelogComponent implements OnInit {
  public dateFormat = 'MM/dd/yyyy';
  @Input() public timelogModalIsVisible: Boolean = false;
  @Input() public selectedTaskItem:Task;
  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  constructor() { }

  ngOnInit() {
  }

  handleOk(): void {
    console.log('Button ok clicked!');
    this.toggleTimeLogShow.emit();
  }

  handleCancel(): void {
    this.timelogModalIsVisible=false;
  }
}
