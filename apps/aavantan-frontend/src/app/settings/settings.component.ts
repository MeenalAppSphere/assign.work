import { Component, OnInit } from '@angular/core';
import { User, TaskType, ProjectMembers } from '@aavantan-app/models';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
  public selectedCollaborators : ProjectMembers[]=[];
  public enableInviteBtn:boolean;
  public stageForm: FormGroup;
  public projectForm: FormGroup;
  public taskTypeForm: FormGroup;

  public activeView:any={
    title:'Project',
    view:'project'
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
  public typesList:TaskType[]=[
    {
      id: '1',
      name: 'BUG',
      color:'#F80647'
    },
    {
      id: '2',
      name: 'CR',
      color:'#F0CB2D'
    },
    {
      id: '3',
      name: 'NEW WORK',
      color:'#0E7FE0'
    },
    {
      id: '4',
      name: 'ENHANCEMENTS',
      color:'#0AC93E'
    },
    {
      id: '5',
      name: 'EPIC',
      color:'#1022A8'
    }];
  public teamsList:ProjectMembers[] = [
    {
      userId: '1',
      emailId: "pradeep@appsphere.in",
      userDetails: {
        firstName: 'Pradeep',
        profilePic:
          'http://themenate.com/enlink/assets/images/avatars/thumb-4.jpg'
      }
    },
    {
      userId: '2',
      emailId: "vishal@appsphere.in",
      userDetails: {
        firstName: 'Vishal',
        profilePic:
          'http://themenate.com/enlink/assets/images/avatars/thumb-5.jpg'
      }
    },
    {
      userId: '3',
      emailId:"aahsish.patil@appsphere.in",
      userDetails: {
        firstName: 'Aashsih',
        profilePic:
          'http://themenate.com/enlink/assets/images/avatars/thumb-6.jpg'
      }
    }
  ];
  public projectMembers:ProjectMembers[] = [
    {
      userId: '1',
      emailId: "pradeep@appsphere.in",
      userDetails: {
        firstName: 'Pradeep',
        profilePic:
          'http://themenate.com/enlink/assets/images/avatars/thumb-4.jpg'
      }
    },
    {
      userId: '2',
      emailId: "vishal@appsphere.in",
      userDetails: {
        firstName: 'Vishal',
        profilePic:
          'http://themenate.com/enlink/assets/images/avatars/thumb-5.jpg'
      }
    },
    {
      userId: '3',
      emailId:"aahsish.patil@appsphere.in",
      userDetails: {
        firstName: 'Aashsih',
        profilePic:
          'http://themenate.com/enlink/assets/images/avatars/thumb-6.jpg'
      }
    }
  ];
  constructor(private FB: FormBuilder, private validationRegexService:ValidationRegexService) {}

  ngOnInit(): void {
    this.collaboratorForm = this.FB.group({
      collaborators: new FormControl(null, [Validators.required]),
    });
    this.stageForm = this.FB.group({
      title: new FormControl(null, [Validators.required]),
    });
    this.projectForm = this.FB.group({
      name: new FormControl(null, [Validators.required]),
    });
    this.taskTypeForm = this.FB.group({
      displayName:new FormControl(null, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      value:new FormControl(null, [Validators.required]),
      color:new FormControl(null, [Validators.required])
    });
    this.selectedCollaborators=this.teamsList;
  }


  public activeTab(view:string, title:string) {
    this.activeView = {
      title: title,
      view: view
    }
  }

  /* project tab */
  public saveProject(){
    console.log('saveProject : ',this.projectForm.value);
  }

  /* collaborators tab */
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
    const user : ProjectMembers = {
      userId:'1',
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


  /* stage tab */
  public addStage(){
    // add api call here
    console.log('addStage : ', this.stageForm.value);
  }

  public removeStage(stage:any){
    console.log('removeStage : ', stage);
  }

  /* task type tab */
  public saveTaskType(){
    // add api call here
    console.log('saveTaskType : ', this.taskTypeForm.value);
    let value = this.taskTypeForm.get('name').value.toUpperCase();
    this.taskTypeForm.get('name').patchValue(value);
    value=value.toLocaleString().trim();
    this.taskTypeForm.get('value').patchValue(value);
    if(this.typesList.filter(item => item.color === this.taskTypeForm.get('color').value || item.name === this.taskTypeForm.get('name').value).length===0){
      this.typesList.push(this.taskTypeForm.value);
    }
  }
  public removeTaskType(taskType:TaskType){
    // remove api call here
    this.typesList = this.typesList.filter(item => item.color !== taskType.color);
  }

}
