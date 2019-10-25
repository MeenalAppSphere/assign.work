import { Component, OnInit } from '@angular/core';
import { User, TaskType, Project, ProjectStages } from '@aavantan-app/models';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ValidationRegexService } from '../shared/services/validation-regex.service';
import { TypeaheadMatch } from 'ngx-bootstrap';
import { GeneralService } from '../shared/services/general.service';
import { ProjectService } from '../shared/services/project/project.service';

@Component({
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsComponent implements OnInit {
  public response: any;
  public collaboratorForm: FormGroup;

  public selectedCollaborator: string;
  public selectedCollaborators: User[] = [];
  public enableInviteBtn: boolean;
  public stageForm: FormGroup;
  public projectForm: FormGroup;
  public taskTypeForm: FormGroup;

  public activeView: any = {
    title: 'Project',
    view: 'project'
  };
  public stagesList: any = [];
  public typesList: TaskType[] = [];
  public teamsList: User[] = [
    {
      id: '1',
      firstName: 'Aashish',
      lastName: 'Patil',
      emailId: 'aashish.patil@appsphere.in'
    },
    {
      id: '2',
      firstName: 'Vishal',
      emailId: 'vishal@appsphere.in'
    },
    {
      id: '3',
      firstName: 'Pradeep',
      lastName: 'Kumar',
      emailId: 'pradeep@appsphere.in'
    }
  ];
  public currentProject: Project = null;
  public updateRequestInProcess: boolean = false;

  constructor(private FB: FormBuilder, private validationRegexService: ValidationRegexService, private _generalService: GeneralService,
              private _projectService: ProjectService) {
  }

  ngOnInit(): void {
    this.currentProject = this._generalService.user.currentProject;
    this.stagesList = this.currentProject.settings.stages;
    this.typesList = this.currentProject.settings.taskTypes;

    this.collaboratorForm = this.FB.group({
      collaborators: new FormControl(null, [Validators.required])
    });

    this.stageForm = this.FB.group({
      name: new FormControl(null, [Validators.required])
    });

    this.projectForm = this.FB.group({
      name: new FormControl(this.currentProject ? this.currentProject.name: null, [Validators.required])
    });

    this.taskTypeForm = this.FB.group({
      name: new FormControl(null, [Validators.required]),
      color: new FormControl(null, [Validators.required])
    });

    this.selectedCollaborators = this.teamsList;
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
      }
    }
  }

  public addStage() {
    this.updateRequestInProcess = true;
    try {
      this._projectService.addStage(this.currentProject.id, this.stageForm.value).subscribe();
      this.updateRequestInProcess = false;
    } catch (e) {
      this.updateRequestInProcess = false;
    }
  }

  public removeStage(stage: ProjectStages) {
    this.updateRequestInProcess = true;
    try {
      this._projectService.removeStage(this.currentProject.id, stage.id).subscribe();
      this.updateRequestInProcess = false;
    } catch (e) {
      this.updateRequestInProcess = false;
    }
  }

  public saveTaskType() {
    this.updateRequestInProcess = true;
    try {
      this._projectService.addTaskType(this.currentProject.id, this.taskTypeForm.value).subscribe();
      this.updateRequestInProcess = false;
    } catch (e) {
      this.updateRequestInProcess = false;
    }
  }

  public removeTaskType(taskType: TaskType) {
    this.updateRequestInProcess = true;
    try {
      this._projectService.removeTaskType(this.currentProject.id, taskType.id).subscribe();
      this.updateRequestInProcess = false;
    } catch (e) {
      this.updateRequestInProcess = false;
    }
  }

  public updateProjectDetails(project: Partial<Project>) {
    this.updateRequestInProcess = true;
    try {
      this._projectService.updateProject(this.currentProject.id, project).subscribe();
      this.updateRequestInProcess = false;
    } catch (e) {
      this.updateRequestInProcess = false;
    }
  }

}
