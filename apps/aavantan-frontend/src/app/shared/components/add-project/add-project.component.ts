import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ValidationRegexService } from '../../services/validation-regex.service';
import {
  GetAllTaskRequestModel,
  Organization,
  Project,
  ProjectMembers,
  ProjectTemplateEnum,
  SearchUserModel,
  SwitchProjectRequest,
  User
} from '@aavantan-app/models';
import { GeneralService } from '../../services/general.service';
import { UserService } from '../../services/user/user.service';
import { ProjectService } from '../../services/project/project.service';
import { UserQuery } from '../../../queries/user/user.query';
import { NzNotificationService } from 'ng-zorro-antd';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { TaskService } from '../../services/task/task.service';
import { Router } from '@angular/router';
import { TaskStatusService } from '../../services/task-status/task-status.service';
import { TaskPriorityService } from '../../services/task-priority/task-priority.service';
import { TaskTypeService } from '../../services/task-type/task-type.service';
import { UserRoleService } from '../../services/user-role/user-role.service';


@Component({
  selector: 'aavantan-app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss']
})
export class AddProjectComponent implements OnInit, OnDestroy {
  @Input() public projectModalIsVisible: boolean = false;
  @Input() public projectListData: Project[] = [];
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();

  public projectForm: FormGroup;
  public collaboratorForm: FormGroup;
  public switchStepCurrent = 0;
  public modalTitle = 'Project Details';
  public selectedCollaborators: User[] = [];
  public isCollaboratorExits: boolean = false;
  public enableInviteBtn: boolean = false;
  public selectedCollaborator: User;
  public userDataSource: User[] = [];
  public collaboratorsDataSource: User[] = [];
  public modelChangedSearchCollaborators = new Subject<string>();


  public response: any;
  public currentOrganization: Organization;
  public organizations: Organization[];
  public organizationCreationInProcess: boolean = false;

  public createProjectInProcess: boolean = false;
  public createdProjectId: string = null;
  public addCollaboratorsInProcess: boolean = false;
  public selectTemplateInProcess: boolean = false;
  public switchingProjectInProcess: boolean;
  public members: User[] = [];
  public showCreateProject: boolean;
  public projectList: Project[] = [];
  public loadingProjects: boolean;
  public projectSource: Project[] = [];
  public projectListSearch: Project[] = [];
  public searchProjectText: string;
  public modelChanged = new Subject<string>();
  public isSearching: boolean;
  public searchSatarted:boolean;

  public selectedTemplate: ProjectTemplateEnum = ProjectTemplateEnum.softwareDevelopment;

  constructor(private FB: FormBuilder, private validationRegexService: ValidationRegexService,
              private _generalService: GeneralService, private _userQuery: UserQuery,
              private _userService: UserService, private _projectService: ProjectService,
              protected notification: NzNotificationService, private _taskService: TaskService,
              private router: Router, private _taskStatusService: TaskStatusService,
              private _taskPriorityService: TaskPriorityService, private _taskTypeService: TaskTypeService,
              private _userRoleService: UserRoleService) {
    // this.getAllUsers();
  }

  ngOnInit() {
    this.organizations = this._generalService.user && this._generalService.user.organizations as Organization[] || [];
    this.currentOrganization = this._generalService.currentOrganization;

    this.projectList = this._generalService.user.projects as Project[];

    this.showCreateProject = !(this.projectList && this.projectList.length > 0);

    this.createFrom();

    if (this.currentOrganization) {
      this.projectForm.get('organizationId').patchValue(this.currentOrganization.id);
    }

    this.projectSource = [];

    this.modelChanged
      .pipe(
        debounceTime(300))
      .subscribe(() => {
        this.searchSatarted = true;
        this.isSearching = true;
        this._projectService.searchProject(this.searchProjectText).subscribe((data) => {
          this.projectListSearch = data.data;
          this.isSearching = false;
        });

      });

    this.projectListSearch = this.projectListData;


    // search collaborators
    this.modelChangedSearchCollaborators
      .pipe(
        debounceTime(500))
      .subscribe(() => {

        const queryText = this.collaboratorForm.get('collaborator').value;
        let name = '';
        if (this.selectedCollaborator) {
          name = this.selectedCollaborator.firstName + ' ' + this.selectedCollaborator.lastName;
        }

        if (!queryText || this.collaboratorForm.get('collaborator').value === name) {
          return;
        }

        this.isSearching = true;
        const json: SearchUserModel = {
          organizationId: this._generalService.currentOrganization.id,
          query: queryText
        };

        this.isCollaboratorExits = false;
        this.selectedCollaborators.forEach((ele) => {
          if (ele.emailId === queryText) {
            this.isCollaboratorExits = true;
          }
        });

        this._userService.searchAddPojectUser(json).subscribe((data) => {
          this.isSearching = false;
          this.collaboratorsDataSource = data.data;
          if (this.collaboratorsDataSource && this.collaboratorsDataSource.length === 0 && !this.validationRegexService.emailValidator(queryText).invalidEmailAddress) {
            this.enableInviteBtn = true;
          } else {
            this.enableInviteBtn = false;
          }
        });

      });
    // end search collaborators

  }

  changed() {
    this.modelChanged.next();
  }


  async switchProject(project: Project) {

    const json: SwitchProjectRequest = {
      organizationId: this._generalService.currentOrganization.id,
      projectId: project.id
    };

    try {
      this.switchingProjectInProcess = true;
      await this._projectService.switchProject(json).toPromise();
      this.switchingProjectInProcess = false;
      this.getTasks();
      this.toggleShow.emit();
    } catch (e) {
      this.switchingProjectInProcess = false;
    }

  }

  public typeahead() {

    this.projectListSearch = this.projectSource.filter((ele) => {
      if (ele.name.includes(this.searchProjectText)) {
        return ele;
      }
    });
    console.log('Found: ', this.projectListSearch);
  }

  public addNewProject() {
    this.showCreateProject = true;
  }

  public createFrom() {
    this.projectForm = this.FB.group({
      name: [null, [Validators.required, Validators.pattern('^[a-zA-Z0-9 ]*$')]],
      description: [null],
      organizationId: ['']
    });

    this.collaboratorForm = this.FB.group({
      collaborator: new FormControl(null, [Validators.required])
    });

  }

  public selectOrg(item: Organization) {
    this.projectForm.get('organizationId').patchValue(item.id);
    this.next();
  }

  pre(): void {
    this.switchStepCurrent -= 1;
  }

  skip(): void {
    this.switchStepCurrent += 1;
  }

  next(): void {
    if (this.switchStepCurrent === 0) {
      // save project
      this.saveProject();
    } else if (this.switchStepCurrent === 1) {
      // add members
      this.addMembers();
    } else {
      this.switchStepCurrent += 1;
    }
  }

  basicModalHandleCancel() {
    this.toggleShow.emit();
    this.router.navigate(['dashboard']);
  }

  async saveProject() {
    if (this.projectForm.invalid) {
      this.notification.error('Error', 'Please Enter Project Name');
      return;
    }

    this.createProjectInProcess = true;
    const project: Project = { ...this.projectForm.getRawValue() };

    try {
      const createdProject = await this._projectService.createProject(project).toPromise();

      this.createdProjectId = createdProject.data.id;
      this.createProjectInProcess = false;

      this.switchStepCurrent++;
    } catch (e) {
      this.createdProjectId = null;
      this.createProjectInProcess = false;
    }
  }


  /*================== Collaborators step ==================*/


  // api call for save members
  async addMembers() {
    this.addCollaboratorsInProcess = true;
    const members: ProjectMembers[] = [];
    this.selectedCollaborators.forEach(f => {
      members.push({
        emailId: f.emailId,
        userId: f.id
      });
    });

    console.log(this.selectedCollaborators);

    try {
      await this._projectService.addCollaborators(this.createdProjectId, members).toPromise();
      this.addCollaboratorsInProcess = false;
      this.switchStepCurrent++;
      this.enableInviteBtn = false;
    } catch (e) {
      this.addCollaboratorsInProcess = false;
    }
  }


  public addCollaborators(isInvite?: boolean) {
    let emailData = null;

    if (isInvite) {
      emailData = this.collaboratorForm.get('collaborator').value;
    } else {
      emailData = this.selectedCollaborator.emailId;
    }

    const user: User = {
      emailId: emailData,
      id: this.selectedCollaborator ? this.selectedCollaborator.id : null
    };

    this.response = this.validationRegexService.emailValidator(user.emailId);
    if (this.selectedCollaborators.filter(item => item.emailId === user.emailId).length === 0) {
      if (!this.response.invalidEmailAddress) {
        this.selectedCollaborators.push(user);
        this.selectedCollaborator = null;
        this.collaboratorForm.get('collaborator').patchValue('');
      }
    }
    this.enableInviteBtn = false;
    console.log(this.selectedCollaborators);
  }


  public selectAssigneeTypeahead(user: User) {
    if (user && user.emailId) {
      this.selectedCollaborator = user;
      this.addCollaborators();
    }
    this.modelChangedSearchCollaborators.next();
  }


  public removeCollaborators(mem: User) {
    this.selectedCollaborators = this.selectedCollaborators.filter(item => item !== mem);
    this.enableInviteBtn = false;
  }

  public onKeydown(event, isPressedInvite?) {
    if (event.key === 'Enter' || isPressedInvite) {
      const member: User = {
        emailId: this.collaboratorForm.get('collaborator').value
      };
      this.response = this.validationRegexService.emailValidator(member.emailId);
      if (this.selectedCollaborators.filter(item => item.emailId === member.emailId).length === 0) {
        if (!this.response.invalidEmailAddress) {
          this.selectedCollaborators.push(member);
          this.selectedCollaborator = null;
          // this.collaboratorForm.get('collaborator').patchValue('');
        }
      }
      this.enableInviteBtn = false;
      this.collaboratorForm.get('collaborator').patchValue('');
    }
  }

  /*================== Collaborators step end ==================*/


  async addTemplate() {
    this.selectTemplateInProcess = true;
    try {
      await this._projectService.updateTemplate({
        template: this.selectedTemplate,
        projectId: this._generalService.currentProject.id
      }).toPromise();
      this.selectTemplateInProcess = false;
      this.getTasks();

      // get all task statuses
      this._taskStatusService.getAllTaskStatuses(this._generalService.currentProject.id).subscribe();

      // get all task types
      this._taskTypeService.getAllTaskTypes(this._generalService.currentProject.id).subscribe();

      // get all task priorities
      this._taskPriorityService.getAllTaskPriorities(this._generalService.currentProject.id).subscribe();

      // get all user roles
      this._userRoleService.getAllUserRoles(this._generalService.currentProject.id).subscribe();

      // get all project limit 10 for header dropdown init
      this._projectService.getAllProject({organizationId: this._generalService.currentOrganization.id}).subscribe();

      this.toggleShow.emit();
    } catch (e) {
      this.selectTemplateInProcess = false;
    }
  }

  public getTasks() {
    const json: GetAllTaskRequestModel = {
      projectId: this._generalService.currentProject.id,
      sort: 'createdAt',
      sortBy: 'desc'
    };
    this._taskService.getAllTask(json).subscribe();
  }

  private getAllUsers() {
    this._userService.getAllUsers().subscribe(res => {
      this.members = res.data;
    }, error => {
      this.members = [];
    });
  }

  ngOnDestroy(): void {
  }
}
