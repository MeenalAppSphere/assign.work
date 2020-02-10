import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BoardColumnIncludedStatus, BoardModel, SearchProjectCollaborators, User } from '@aavantan-app/models';
import { debounceTime } from 'rxjs/operators';
import { UserService } from '../../../shared/services/user/user.service';
import { Subject } from 'rxjs';
import { GeneralService } from '../../../shared/services/general.service';


@Component({
  selector: 'aavantan-hidden-status',
  templateUrl: './hidden-status.component.html',
  styleUrls: ['./hidden-status.component.scss']
})
export class HiddenStatusComponent implements OnInit, OnDestroy {

  @Input() public showHiddenStatusModalIsVisible: boolean = false;
  @Output() toggleHiddenStatusModalShow: EventEmitter<any> = new EventEmitter<any>();
  @Input() public statusList: BoardColumnIncludedStatus[] = [];

  constructor(protected notification: NzNotificationService) {
  }

  ngOnInit() {

  }

  handleCancel(): void {
    this.toggleHiddenStatusModalShow.emit();
  }

  ngOnDestroy() {
  }
}
