import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { StatusDDLModel } from '@aavantan-app/models';

@Component({
  selector: 'status-dropdown',
  templateUrl: './status-dropdown.component.html',
  styleUrls: ['./status-dropdown.component.scss']
})
export class StatusDropdownComponent implements OnInit, OnDestroy {

  @Input() public statusList: StatusDDLModel;

  constructor() {
  }

  ngOnInit() {

  }

  public resetStatus() {

  }

  ngOnDestroy() {

  }

}
