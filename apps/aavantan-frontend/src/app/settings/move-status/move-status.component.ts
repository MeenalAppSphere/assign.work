import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskService } from '../../shared/services/task/task.service';
import { GeneralService } from '../../shared/services/general.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ProjectService } from '../../shared/services/project/project.service';
import { TaskStatusModel } from '@aavantan-app/models';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { TaskStatusQuery } from '../../queries/task-status/task-status.query';

@Component({
  selector: 'aavantan-move-status',
  templateUrl: './move-status.component.html',
  styleUrls: ['./move-status.component.scss']
})
export class MoveStatusComponent implements OnInit, OnDestroy {
  @Input() public moveStatusModalIsVisible: boolean = false;
  @Output() toggleMoveStatusShow: EventEmitter<any> = new EventEmitter<any>();

  public statusDataSource: TaskStatusModel[] = [];
  public selectedStatus: TaskStatusModel;

  constructor(protected notification: NzNotificationService,
              private _taskService: TaskService,
              private _taskStatusQuery: TaskStatusQuery,
              private _generalService: GeneralService,
              private FB: FormBuilder) {
  }

  ngOnInit() {
    // get all task status from store
    this._taskStatusQuery.statuses$.pipe(untilDestroyed(this)).subscribe(statuses => {
      this.statusDataSource = statuses;
    });
  }

  public selectStatus(item: TaskStatusModel) {
    this.selectedStatus = item;
  }

  public moveTask() {
    this.toggleMoveStatusShow.emit();
  }

  handleCancel(): void {
    this.toggleMoveStatusShow.emit();
  }

  ngOnDestroy() {

  }

}
