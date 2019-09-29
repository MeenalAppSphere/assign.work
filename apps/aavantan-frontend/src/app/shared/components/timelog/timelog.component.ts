import { Component, OnInit, ViewChild } from '@angular/core';
import { PopoverContainerComponent } from 'ngx-bootstrap';

@Component({
  selector: 'app-timelog',
  templateUrl: './timelog.component.html',
  styleUrls: ['./timelog.component.scss']
})
export class TimelogComponent implements OnInit {
  public dateFormat = 'MM/dd/yyyy';
  constructor() { }

  ngOnInit() {
  }

  public closeTimeLog() {

  }

}
