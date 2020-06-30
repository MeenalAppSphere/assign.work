import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { StatusDDLModel } from '@aavantan-app/models';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'status-dropdown',
  templateUrl: './status-dropdown.component.html',
  styleUrls: ['./status-dropdown.component.scss']
})
export class StatusDropdownComponent implements OnInit, OnDestroy {

  @Input() public statusList: StatusDDLModel[];
  @Output() statusIdsEmitter: EventEmitter<any> = new EventEmitter<any>();

  public cloneStatusList:StatusDDLModel[] = [];
  public selectedStatusList: StatusDDLModel[];

  constructor() {
  }

  ngOnInit() {
      this.prepareStatusIdsSelection();
  }

  // Select status from dropdown
  // check/uncheck toggle
  // create status ids array to emit parent
  public toggleStatus(item) {
      this.statusList.map((status)=>{
        if(status.value===item.value) status.checked = !item.checked;
      });
      this.prepareStatusIdsSelection();
  }

  // Prepare status ids to emit
  // Prepare selected status to show in status box as tags with count
  public prepareStatusIdsSelection(){
    if(this.cloneStatusList.length===0){
      this.cloneStatusList = cloneDeep(this.statusList);
    }
    const statusIds:string[] = [];
    this.selectedStatusList=[];
    this.statusList.forEach((status) => {
      if(status.checked) {
        this.selectedStatusList.push(status);
        statusIds.push(status.value);
      }
    });
    this.statusIdsEmitter.emit(statusIds);
  }

  // reset to initial state without done/complete...
  public resetStatus() {
    this.statusList = this.cloneStatusList;
    this.prepareStatusIdsSelection();
  }

  ngOnDestroy() {

  }

}
