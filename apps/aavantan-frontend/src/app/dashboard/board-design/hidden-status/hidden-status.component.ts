import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskStatusModel } from '@aavantan-app/models';

@Component({
  selector: 'aavantan-hidden-status',
  templateUrl: './hidden-status.component.html',
  styleUrls: ['./hidden-status.component.scss']
})
export class HiddenStatusComponent implements OnInit, OnDestroy {

  @Input() public showHiddenStatusModalIsVisible: boolean = false;
  @Input() public statusList: TaskStatusModel[] = [];
  @Input() public getHiddenStatusInProcess: boolean = false;

  @Output() toggleHiddenStatusModalShow: EventEmitter<any> = new EventEmitter<any>();
  @Output() showColumnStatusEvent: EventEmitter<string> = new EventEmitter<string>();

  constructor(protected notification: NzNotificationService) {
  }

  ngOnInit() {

  }

  handleCancel(): void {
    this.toggleHiddenStatusModalShow.emit();
  }

  showStatus(statusId: string) {
    this.showColumnStatusEvent.emit(statusId);
  }

  ngOnDestroy() {
  }
}
