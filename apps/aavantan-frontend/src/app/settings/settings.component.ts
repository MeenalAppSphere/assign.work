import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  User,
  TaskType,
  Project,
  ProjectStages,
  ProjectMembers,
  ProjectPriority,
  ProjectStatus, ProjectWorkingCapacityUpdateDto
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

  public selectedCollaborator: string;
  public selectedCollaborators: User[] = [];
  public userDataSource:User[]=[];
  public enableInviteBtn: boolean;
  public stageForm: FormGroup;
  public statusForm: FormGroup;
  public projectForm: FormGroup;
  public taskTypeForm: FormGroup;
  public priorityForm:FormGroup;

  public activeView: any = {
    title: 'Project',
    view: 'project'
  };
  public stagesList: any = [];
  public statusList: ProjectStatus[]=[];
  public typesList: TaskType[] = [];
  public priorityList: ProjectPriority[]=[];
  public projectMembersList: ProjectMembers[]=[];

  public currentProject: Project = null;
  public addCollaboratorsInProcess: boolean = false;
  public updateRequestInProcess: boolean = false;
  public deleteStageInProcess: boolean = false;
  public deleteStatusInProcess: boolean = false;
  public deleteTaskTypeInProcess: boolean = false;

  public totalCapacity: number = 0;

  constructor(protected notification: NzNotificationService, private FB: FormBuilder, private validationRegexService: ValidationRegexService, private _generalService: GeneralService,
              private _projectService: ProjectService, private _userQuery: UserQuery) {
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

        if(this.projectMembersList && this.projectMembersList.length>0){
          this.projectMembersList.forEach((ele)=>{
            this.totalCapacity = this.totalCapacity + Number(ele.workingCapacity);
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
    if(this.stageForm.invalid){
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
    if(this.statusForm.invalid){
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

  public savePriority() {
    if(this.priorityForm.invalid){
      this.notification.error('Error', 'Please check Color and Priority');
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

  public saveTaskType() {
    if(this.taskTypeForm.invalid){
      this.notification.error('Error', 'Please check Display name, Color and Task type');
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

  public saveCapacity(){
    const capacityList: ProjectWorkingCapacityUpdateDto[] = [];

    this.projectMembersList.forEach((ele)=>{
      const obj:ProjectWorkingCapacityUpdateDto = { userId : ele.userId, workingCapacity:ele.workingCapacity};
        capacityList.push(obj);
    });

    this.updateRequestInProcess = true;
    this._projectService.updateCapacity(this.currentProject.id, capacityList).subscribe((res => {
      this.taskTypeForm.reset();
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));
  }

  public updateProjectDetails(project: Partial<Project>) {
    this.updateRequestInProcess = true;
    this._projectService.updateProject(this.currentProject.id, project).subscribe((res => {
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));

  }

  public ngOnDestroy(): void {
  }

}
