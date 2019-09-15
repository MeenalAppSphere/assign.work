import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'aavantan-app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit {
  @Input() public modalBasicIsVisible: Boolean = false;
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();
  public FirstForm: FormGroup;
  public SecondForm: FormGroup;
  public ThirdForm: FormGroup;
  public basicCurrent = 1;
  public swicthStepCurrent = 0;
  public index = 'Project Details';
  public radioValue='A';

  constructor(private firstFB: FormBuilder) { }
  listOfOption = [
    {label:'Pradeep',value:'Pradeep', IsInvitationSent:true},
    {label:'Vishal',value:'Vishal', IsInvitationSent:false},
    {label:'Jhon',value:'Jhon', IsInvitationSent:true}
    ];
  listOfSelectedValue: string[] = [];

  ngOnInit() {
    this.createFrom();
  }

  isNotSelected(value: any): boolean {
    return this.listOfSelectedValue.indexOf(value) === -1;
  }
  public createFrom(){
    this.FirstForm = this.firstFB.group({
      projectName : [ null, [ Validators.email ] ],
      description : [ null, [ Validators.required ] ]
    });
    this.SecondForm = this.firstFB.group({
      projectName : [ null, [ Validators.email ] ]
    });
    this.ThirdForm = this.firstFB.group({
      collaborators : [ null, [] ]
    });
  }

  pre(): void {
    this.swicthStepCurrent -= 1;
    this.changeContent();
  }

  next(): void {
    this.swicthStepCurrent += 1;
    this.changeContent();
  }

  done(): void {
    this.toggleShow.emit();
  }

  basicModalHandleCancel(){
    this.toggleShow.emit();
  }
  changeContent(): void {
    switch (this.swicthStepCurrent) {
      case 0: {
        this.index = 'Project Details';
        break;
      }
      case 1: {
        this.index = 'Organization';
        break;
      }
      case 2: {
        this.index = 'Collaborators';
        break;
      }
      case 3: {
        this.index = 'Template';
        break;
      }
      default: {
        this.index = 'error';
      }
    }
  }
}
