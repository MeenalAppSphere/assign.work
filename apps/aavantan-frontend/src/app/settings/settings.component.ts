import { Component, OnInit } from '@angular/core';
import { User } from '@aavantan-app/models';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ValidationRegexService } from '../shared/services/validation-regex.service';
import { TypeaheadMatch } from 'ngx-bootstrap';

@Component({
    templateUrl: './settings.component.html',
    styleUrls:['./settings.component.scss']
})

export class SettingsComponent implements OnInit{
  public response:any;
  public collaboratorForm: FormGroup;
  public selectedCollaborator: string;
  public selectedCollaborators : User[]=[];
  public enableInviteBtn:boolean;
  public stageForm: FormGroup;
  public activeView:any={
    title:'Collaborators',
    view:'collaborators'
  };
  public stagesList:any=[
    {
      name:'TO Do',
      id:'1',
      position:1
    },
    {
      name:'In-Progress',
      id:'2',
      position:2
    },
    {
      name:'Done',
      id:'1',
      position:3
    }];
  public typesList:any=[
    {
      _id: 1,
      name: 'BUG',
      value: 'bug'
    },
    {
      _id: 2,
      name: 'CR',
      value: 'cr'
    },
    {
      _id: 3,
      name: 'NEW WORK',
      value: 'newwork'
    },
    {
      _id: 4,
      name: 'ENHANCEMENTS',
      value: 'enhancement'
    },
    {
      _id: 4,
      name: 'EPIC',
      value: 'epic'
    }];
  public teamsList:User[] = [
    {
      id: '1',
      firstName: 'Aashish',
      lastName:'Patil',
      emailId:'aashish.patil@appsphere.in'
    },
    {
      id: '2',
      firstName: 'Vishal',
      emailId:'vishal@appsphere.in'
    },
    {
      id: '3',
      firstName: 'Pradeep',
      lastName:'Kumar',
      emailId:'pradeep@appsphere.in'
    }
  ];
  constructor(private FB: FormBuilder, private validationRegexService:ValidationRegexService) {}

  ngOnInit(): void {
    this.collaboratorForm = this.FB.group({
      collaborators: ''
    });
    this.stageForm = this.FB.group({
      title: ''
    });
    this.selectedCollaborators=this.teamsList;
  }


  public activeTab(view:string, title:string) {
    this.activeView = {
      title: title,
      view: view
    }
  }

  public addStage(){
    // add api call here
  }

  public removeCollaborators(user: User) {
    // remove api call here
    this.selectedCollaborators = this.selectedCollaborators.filter(item => item.emailId !== user.emailId);
  }

  public typeaheadOnSelect(e: TypeaheadMatch): void {
    if(this.selectedCollaborators.filter(item => item.emailId === e.item.emailId).length===0){
      this.selectedCollaborators.push(e.item);
    }
    this.selectedCollaborator=null;
  }

  public onKeydown(event) {
    const val=event.key;
    if (val === "Enter") {
      this.addCollaborators();
    }else{
      setTimeout(()=>{

        if(val) {
          const hasValues=
            this.selectedCollaborators.filter((o)=>{
              return o.emailId===this.selectedCollaborator;
            });
            if(hasValues && hasValues.length){
              this.enableInviteBtn=false;
            }else{
              if(!this.validationRegexService.emailValidator(this.selectedCollaborator).invalidEmailAddress){
                this.enableInviteBtn=true;
              }else{
                this.enableInviteBtn=false;
              }
            }
        }
      },300);
    }
  }
  public addCollaborators(){
    const user : User = {
      emailId : this.selectedCollaborator
    };
    this.response=this.validationRegexService.emailValidator(user.emailId);
    if(this.selectedCollaborators.filter(item => item.emailId === user.emailId).length===0){
      if(!this.response.invalidEmailAddress){
        this.selectedCollaborators.push(user);
        this.selectedCollaborator=null;
        this.enableInviteBtn=false;
      }
    }
  }


  public removeStage(stage:any){
    console.log('Removing', stage);
  }

}
