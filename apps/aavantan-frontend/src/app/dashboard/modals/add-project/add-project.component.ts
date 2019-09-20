import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap';
import { ProjectRequest, Member } from '../../../models/project.model';
import { ValidationRegexService } from '../../../shared/services/validation-regex.service';

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
  public selectedCollaborators: Member[] = [];
  public selectedCollaborator: string;
  public response:any;

  public members: Member[] = [
    {emailId:'pradeep@gmail.com', isEmailSent:true},
    {emailId:'deep@gmail.com'},
    {emailId:'deep1@gmail.com'},
  ];

  constructor(private FB: FormBuilder, private validationRegexService:ValidationRegexService) {
  }

  ngOnInit() {
    this.createFrom();
  }

  public createFrom(){
    this.FirstForm = this.FB.group({
      projectName : [ null, [ Validators.required ] ],
      description : [ null ]
    });
    this.SecondForm = this.FB.group({
      organizationName : [ null, [ Validators.required ] ]
    });
    this.ThirdForm = this.FB.group({
      collaborators: ''
    });

  }

  public removeCollaborators(mem: Member) {
    this.selectedCollaborators = this.selectedCollaborators.filter(item => item !== mem);
  }

  public typeaheadOnSelect(e: TypeaheadMatch): void {
    if(this.selectedCollaborators.filter(item => item === e.item).length===0){
      this.selectedCollaborators.push(e.item);
    }
    this.selectedCollaborator=null;
  }

  public onKeydown(event) {
    if (event.key === "Enter") {
      const member : Member = {
        emailId : this.selectedCollaborator
      };
      this.response=this.validationRegexService.emailValidator(member.emailId);
      if(this.selectedCollaborators.filter(item => item === member).length===0){
        // @ts-ignore
        if(!this.response.invalidEmailAddress){
          this.selectedCollaborators.push(member);
          this.selectedCollaborator=null;
        }
      }
    }
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
