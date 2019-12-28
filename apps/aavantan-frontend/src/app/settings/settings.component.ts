import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  Project,
  ProjectMembers,
  ProjectPriority,
  ProjectStages,
  ProjectStatus,
  ProjectWorkingCapacityUpdateDto, ProjectWorkingDays,
  TaskType,
  User
} from '@aavantan-app/models';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ValidationRegexService } from '../shared/services/validation-regex.service';
import { TypeaheadMatch } from 'ngx-bootstrap';
import { GeneralService } from '../shared/services/general.service';
import { ProjectService } from '../shared/services/project/project.service';
import { UserQuery } from '../queries/user/user.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { NzNotificationService } from 'ng-zorro-antd';
import { cloneDeep } from 'lodash';

@Component({
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsComponent implements OnInit, OnDestroy {
  public response: any;
  public collaboratorForm: FormGroup;

  public projectModalIsVisible:boolean;
  public selectedCollaborator: string;
  public selectedCollaborators: User[] = [];
  public userDataSource: User[] = [];
  public enableInviteBtn: boolean;
  public stageForm: FormGroup;
  public statusForm: FormGroup;
  public projectForm: FormGroup;
  public taskTypeForm: FormGroup;
  public priorityForm: FormGroup;

  public activeView: any = {
    title: 'Project',
    view: 'project'
  };
  public stagesList: any = [];
  public statusList: ProjectStatus[] = [];
  public typesList: TaskType[] = [];
  public priorityList: ProjectPriority[] = [];
  public projectMembersList: ProjectMembers[] = [];
  public projectCapacityMembersList: ProjectMembers[] = [];
  public projectListData:Project[] = [];

  public currentProject: Project = null;
  public addCollaboratorsInProcess: boolean = false;
  public updateRequestInProcess: boolean = false;
  public deleteStageInProcess: boolean = false;
  public deleteStatusInProcess: boolean = false;
  public deleteTaskTypeInProcess: boolean = false;
  public getProjectsInProcess:boolean = true;
  public totalCapacity: number = 0;
  public totalCapacityPerDay: number = 0;
  public workingDays : ProjectWorkingDays[] = [
    {
      day :'Mon',
      selected :true
    },{
      day :'Tue',
      selected :true
    },{
      day :'Wed',
      selected :true
    },{
      day :'Thu',
      selected :true
    },{
      day :'Fri',
      selected :true
    },{
      day :'Sat',
      selected :false
    },{
      day :'Sun',
      selected :false
    }
  ];

  constructor(protected notification: NzNotificationService, private FB: FormBuilder, private validationRegexService: ValidationRegexService, private _generalService: GeneralService,
              private _projectService: ProjectService, private _userQuery: UserQuery) {
    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  ngOnInit(): void {
    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentProject = res;
        this.stagesList = res.settings.stages;
        this.statusList = res.settings.status;
        this.typesList = res.settings.taskTypes;
        this.priorityList = res.settings.priorities;
        this.projectMembersList = cloneDeep(res.members);

        this.totalCapacity = 0;
        this.totalCapacityPerDay = 0;
        if (this.projectMembersList && this.projectMembersList.length > 0) {
          this.projectCapacityMembersList = this.projectMembersList.filter((ele)=>{
            if(ele.isInviteAccepted){
              return ele;
            }
          })
          this.projectCapacityMembersList.forEach((ele) => {
            this.totalCapacity = this.totalCapacity + Number(ele.workingCapacity);
            this.totalCapacityPerDay = this.totalCapacityPerDay + Number(ele.workingCapacityPerDay);
          });
        }

      }
    });

    this.collaboratorForm = this.FB.group({
      collaborators: new FormControl(null, [Validators.required])
    });

    this.stageForm = this.FB.group({
      name: new FormControl(null, [Validators.required])
    });

    this.statusForm = this.FB.group({
      name: new FormControl(null, [Validators.required])
    });

    this.projectForm = this.FB.group({
      name: new FormControl(this.currentProject ? this.currentProject.name : null, [Validators.required])
    });

    this.taskTypeForm = this.FB.group({
      displayName: new FormControl(null, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      color: new FormControl(null, [Validators.required])
    });

    this.priorityForm = this.FB.group({
      name: new FormControl(null, [Validators.required]),
      color: new FormControl(null, [Validators.required])
    });

    this.getProjects();

  }

  public getProjects(){
    try {
      this._projectService.getAllProject().subscribe((data)=>{
        this.projectListData = data.data;
        this.getProjectsInProcess=false;
      });
    }catch (e) {
      this.getProjectsInProcess=false;
    }

  }
  public activeTab(view: string, title: string) {
    this.activeView = {
      title: title,
      view: view
    };
  }

  public saveProject() {
    this.updateProjectDetails(this.projectForm.value);
  }

  public removeCollaborators(user: User) {
    // remove api call here
    this.selectedCollaborators = this.selectedCollaborators.filter(item => item.emailId !== user.emailId);
  }

  public resendInvitation(user: User) {
    console.log('Resend Invitation');
  }

  public typeaheadOnSelect(e: TypeaheadMatch): void {
    if (this.selectedCollaborators.filter(item => item.emailId === e.item.emailId).length === 0) {
      this.selectedCollaborators.push(e.item);
      this.addMembers();
    }
    this.selectedCollaborator = null;
  }

  public onKeydown(event) {
    const val = event.key;
    if (val === 'Enter') {
      this.addCollaborators();
    } else {
      setTimeout(() => {

        if (val) {
          const hasValues =
            this.selectedCollaborators.filter((o) => {
              return o.emailId === this.selectedCollaborator;
            });
          if (hasValues && hasValues.length) {
            this.enableInviteBtn = false;
          } else {
            if (!this.validationRegexService.emailValidator(this.selectedCollaborator).invalidEmailAddress) {
              this.enableInviteBtn = true;
            } else {
              this.enableInviteBtn = false;
            }
          }
        }
      }, 300);
    }
  }

  async addMembers() {
    this.addCollaboratorsInProcess = true;
    const members: ProjectMembers[] = [];
    this.selectedCollaborators.forEach(f => {
      members.push({
        emailId: f.emailId,
        userId: f.id
      });
    });

    try {
      await this._projectService.addCollaborators(this.currentProject.id, members).toPromise();
      this.selectedCollaborators = [];
      this.addCollaboratorsInProcess = false;
    } catch (e) {
      this.addCollaboratorsInProcess = false;
    }
  }


  public addCollaborators() {
    const user: User = {
      emailId: this.selectedCollaborator
    };
    this.response = this.validationRegexService.emailValidator(user.emailId);
    if (this.selectedCollaborators.filter(item => item.emailId === user.emailId).length === 0) {
      if (!this.response.invalidEmailAddress) {
        this.selectedCollaborators.push(user);
        this.selectedCollaborator = null;
        this.enableInviteBtn = false;
        this.addMembers();
      }
    }
  }

  public addStage() {
    if (this.stageForm.invalid) {
      this.notification.error('Error', 'Please check Stage title');
      return;
    }
    this.updateRequestInProcess = true;
    this._projectService.addStage(this.currentProject.id, this.stageForm.value).subscribe((res => {
      this.stageForm.reset();
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));
  }

  public removeStage(stage: ProjectStages) {
    this.deleteStageInProcess = true;
    this._projectService.removeStage(this.currentProject.id, stage.id).subscribe((res => {
      this.deleteStageInProcess = false;
    }), (error => {
      this.deleteStageInProcess = false;
    }));
  }

  public addStatus() {
    if (this.statusForm.invalid) {
      this.notification.error('Error', 'Please check Status title');
      return;
    }
    this.updateRequestInProcess = true;
    this._projectService.addStatus(this.currentProject.id, this.statusForm.value).subscribe((res => {
      this.statusForm.reset();
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));
  }

  public removeStatus(status: ProjectStatus) {
    this.deleteStatusInProcess = true;
    this._projectService.removeStatus(this.currentProject.id, status.id).subscribe((res => {
      this.deleteStatusInProcess = false;
    }), (error => {
      this.deleteStatusInProcess = false;
    }));
  }

  //================== Priority ==================//
  public savePriority() {
    if (this.priorityForm.invalid) {
      this.notification.error('Error', 'Please check Color and Priority');
      return;
    }

    const dup: ProjectPriority[] = this.priorityList.filter((ele) => {
      if (ele.color === this.priorityForm.value.color || ele.name === this.priorityForm.value.name) {
        return ele;
      }
    });

    if (dup && dup.length > 0) {
      this.notification.error('Error', 'Duplicate color or name');
      return;
    }

    this.updateRequestInProcess = true;
    this._projectService.addPriority(this.currentProject.id, this.priorityForm.value).subscribe((res => {
      this.priorityForm.reset();
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));
  }

  //================== task type ==================//
  public saveTaskType() {
    if (this.taskTypeForm.invalid) {
      this.notification.error('Error', 'Please check Display name, Color and Task type');
      return;
    }
    const dup: TaskType[] = this.typesList.filter((ele) => {
      if (ele.color === this.taskTypeForm.value.color || ele.name === this.taskTypeForm.value.name || ele.displayName === this.taskTypeForm.value.displayName) {
        return ele;
      }
    });

    if (dup && dup.length > 0) {
      this.notification.error('Error', 'Duplicate Display Name, Color or Task type');
      return;
    }
    this.updateRequestInProcess = true;
    this._projectService.addTaskType(this.currentProject.id, this.taskTypeForm.value).subscribe((res => {
      this.taskTypeForm.reset();
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));
  }

  public removeTaskType(taskType: TaskType) {
    this.deleteTaskTypeInProcess = true;
    this._projectService.removeTaskType(this.currentProject.id, taskType.id).subscribe((res => {
      this.deleteTaskTypeInProcess = false;
    }), (error => {
      this.deleteTaskTypeInProcess = false;
    }));
  }


  //================== capacity ==================//
  public selectDay(wd:ProjectWorkingDays, userRow:ProjectMembers){
      if(wd.selected){
        wd.selected = false;
      } else{
        wd.selected = true;
      }
      const countSelected = userRow.workingDays.filter((ele)=>{if(ele.selected){return ele;}});
      userRow.workingCapacity =  userRow.workingCapacityPerDay * countSelected.length;
      this.calculateTotal();
  }
  public saveCapacity() {
    const capacityList: ProjectWorkingCapacityUpdateDto[] = [];
    this.totalCapacity = 0;
    this.totalCapacityPerDay = 0;
    this.projectCapacityMembersList.forEach((ele) => {
      this.totalCapacity = this.totalCapacity + Number(ele.workingCapacity);
      this.totalCapacityPerDay = this.totalCapacityPerDay + Number(ele.workingCapacityPerDay);
      const obj: ProjectWorkingCapacityUpdateDto = {
        userId: ele.userId,
        workingCapacityPerDay: ele.workingCapacityPerDay,
        workingCapacity: ele.workingCapacity,
        workingDays: ele.workingDays
      };
      capacityList.push(obj);
    });

    this.updateRequestInProcess = true;
    this._projectService.updateCapacity(this.currentProject.id, capacityList).subscribe((res => {
      // this.taskTypeForm.reset();
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));
  }

  public calculateTotal() {
    this.totalCapacity = 0;
    this.totalCapacityPerDay = 0;

    if (this.projectCapacityMembersList && this.projectMembersList.length > 0) {
      this.projectCapacityMembersList.forEach((ele) => {

        const countSelected = ele.workingDays.filter((ele1)=>{if(ele1.selected){return ele1;}});
        ele.workingCapacity =  ele.workingCapacityPerDay * countSelected.length;

        this.totalCapacity = this.totalCapacity + Number(ele.workingCapacity);
        this.totalCapacityPerDay = this.totalCapacityPerDay + Number(ele.workingCapacityPerDay);

      });
    }

  }

  //================== project tab ==================//
  public updateProjectDetails(project: Partial<Project>) {
    this.updateRequestInProcess = true;
    this._projectService.updateProject(this.currentProject.id, project).subscribe((res => {
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));

  }

  projectModalShow(): void {
      this.projectModalIsVisible = !this.projectModalIsVisible;
  }

  public ngOnDestroy(): void {
  }

}
