import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap';
import { ValidationRegexService } from '../../services/validation-regex.service';
import { User } from '@aavantan-app/models';


@Component({
  selector: 'aavantan-app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit {
  @Input() public projectModalIsVisible: Boolean = false;
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();
  public projectForm: FormGroup;
  public collaboratorForm: FormGroup;
  public basicCurrent = 1;
  public swicthStepCurrent = 0;
  public modalTitle = 'Project Details';
  public radioValue='A';
  public selectedCollaborators: User[] = [];
  public selectedCollaborator: string;
  public response:any;

  public members: User[] = [
    {id:'1', firstName:'Pradeep', emailId:'pradeep@gmail.com', isEmailSent : true},
    {id:'2', firstName:'Deep', emailId:'deep@gmail.com'},
    {id:'3', firstName :'Deep1', emailId:'deep1@gmail.com'},
  ];

  constructor(private FB: FormBuilder, private validationRegexService:ValidationRegexService) {
  }

  ngOnInit() {
    this.createFrom();
  }

  public createFrom(){
    this.projectForm = this.FB.group({
      projectName : [ null, [ Validators.required, Validators.pattern('^$|^[A-Za-z0-9]+') ] ],
      description : [ null ]
    });
    this.collaboratorForm = this.FB.group({
      collaborators: ''
    });

  }

  public removeCollaborators(mem: User) {
    this.selectedCollaborators = this.selectedCollaborators.filter(item => item !== mem);
  }

  public typeaheadOnSelect(e: TypeaheadMatch): void {
    if(this.selectedCollaborators.filter(item => item.emailId === e.item.emailId).length===0){
      this.selectedCollaborators.push(e.item);
    }
    this.selectedCollaborator=null;
  }

  public onKeydown(event) {
    if (event.key === "Enter") {
      const member : User = {
        emailId : this.selectedCollaborator
      };
      this.response=this.validationRegexService.emailValidator(member.emailId);
      if(this.selectedCollaborators.filter(item => item.emailId === member.emailId).length===0){
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
        this.modalTitle = 'Organization';
        break;
      }
      case 1: {
        this.modalTitle = 'Project Details';
        break;
      }
      case 2: {
        this.modalTitle = 'Collaborators';
        break;
      }
      case 3: {
        this.modalTitle = 'Template';
        break;
      }
      default: {
        this.modalTitle = 'error';
      }
    }
    this.saveForm();
  }

  public saveForm(){
    console.log('Save : ', this.modalTitle)
  }

}
