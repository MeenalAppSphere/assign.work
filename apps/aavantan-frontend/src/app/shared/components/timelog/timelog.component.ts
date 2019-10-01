import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { PopoverContainerComponent } from 'ngx-bootstrap';

@Component({
  selector: 'app-timelog',
  templateUrl: './timelog.component.html',
  styleUrls: ['./timelog.component.scss']
})
export class TimelogComponent implements OnInit {
  public dateFormat = 'MM/dd/yyyy';
  @Input() public timelogModalIsVisible: Boolean = false;
  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  constructor() { }

  ngOnInit() {
  }

  public closeTimeLog() {
    this.toggleTimeLogShow.emit();
  }

}
