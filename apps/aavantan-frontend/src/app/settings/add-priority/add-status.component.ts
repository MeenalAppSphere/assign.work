import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskService } from '../../shared/services/task/task.service';
import { GeneralService } from '../../shared/services/general.service';

@Component({
  selector: 'aavantan-add-status',
  templateUrl: './add-status.component.html',
})
export class AddStatusComponent implements OnInit, OnDestroy {
  @Input() public addStatusModalIsVisible: Boolean = false;
  @Output() toggleAddStatusShow: EventEmitter<any> = new EventEmitter<any>();

  constructor(protected notification: NzNotificationService,
              private _taskService: TaskService,
              private _generalService: GeneralService) {
  }

  ngOnInit() {

  }

  handleCancel(): void {
    this.toggleAddStatusShow.emit();
  }

  ngOnDestroy() {

  }

}
