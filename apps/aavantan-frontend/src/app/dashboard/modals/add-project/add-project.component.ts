import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap';
import { ValidationRegexService } from '../../../shared/services/validation-regex.service';
import { Member } from '../../../shared/interfaces/member.interface';

@Component({
  selector: 'aavantan-app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit {
  @Input() public modalBasicIsVisible: Boolean = false;
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();
  public orgForm: FormGroup;
  public projectForm: FormGroup;
  public collaboratorForm: FormGroup;
  public basicCurrent = 1;
  public swicthStepCurrent = 0;
  public modalTitle = 'Project Details';
  public radioValue='A';
  public selectedCollaborators: Member[] = [];
  public selectedCollaborator: string;
  public response:any;

  public organizations: any = [
    // {
    //   name: 'App Sphere Softwares',
    //   _id: '121212',
    //   owner: 'Owner : Aashish Patil'
    // },
    // {
    //   name: 'App Sphere Enterprises',
    //   _id: '131212',
    //   owner: 'Owner : Aashish Patil'
    // }
  ];

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
    this.projectForm = this.FB.group({
      projectName : [ null, [ Validators.required ] ],
      description : [ null ]
    });
    this.orgForm = this.FB.group({
      organizationName : [ null, [ Validators.required ] ],
      organizationDescription:[null, '']
    });
    this.collaboratorForm = this.FB.group({
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

  public selectOrg(item) {
    console.log('Selected Org:', item.name);
    this.next();
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
