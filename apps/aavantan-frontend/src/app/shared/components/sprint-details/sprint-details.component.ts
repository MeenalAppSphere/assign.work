import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-sprint-details',
  templateUrl: './sprint-details.component.html',
  styleUrls: ['./sprint-details.component.scss']
})
export class SprintDetailsComponent implements OnInit, OnDestroy {
  @Input() public sprintGoalModalIsVisible: boolean;
  @Input() public goal: string;
  @Input() public startedAt: Date;
  @Input() public endAt: Date;

  @Output() toggleSprintDetailsModal: EventEmitter<any> = new EventEmitter<any>();

  constructor() {
  }

  ngOnInit() {

  }

  handleCancel (){
    this.toggleSprintDetailsModal.emit();
  }

  ngOnDestroy(): void {
  }
}
