import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap';
import { ValidationRegexService } from '../../services/validation-regex.service';
import {
  GetAllTaskRequestModel,
  Organization,
  Project,
  ProjectMembers,
  ProjectTemplateEnum,
  SwitchProjectRequest,
  User
} from '@aavantan-app/models';
import { GeneralService } from '../../services/general.service';
import { UserService } from '../../services/user/user.service';
import { ProjectService } from '../../services/project/project.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserQuery } from '../../../queries/user/user.query';
import { NzNotificationService } from 'ng-zorro-antd';
import { cloneDeep } from '@babel/types';
import { Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { TaskService } from '../../services/task/task.service';


@Component({
  selector: 'aavantan-app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss']
})
export class AddProjectComponent implements OnInit, OnDestroy {
  @Input() public projectModalIsVisible: boolean = false;
  @Input() public projectListData:Project[]=[];
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();

  public projectForm: FormGroup;
  public switchStepCurrent = 0;
  public modalTitle = 'Project Details';
  public selectedCollaborators: User[] = [];
  public selectedCollaborator: string;
  public selectedTemplate: ProjectTemplateEnum = ProjectTemplateEnum.softwareDevelopment;
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
  public isSearching:boolean;

  constructor(private FB: FormBuilder, private validationRegexService: ValidationRegexService,
              private _generalService: GeneralService, private _userQuery: UserQuery,
              private _usersService: UserService, private _projectService: ProjectService,
              protected notification: NzNotificationService, private _taskService : TaskService) {
    this.getAllUsers();
  }

  ngOnInit() {
    this.organizations = this._generalService.user && this._generalService.user.organizations as Organization[] || [];
    this.currentOrganization = this._generalService.currentOrganization;

    this.projectList = this._generalService.user.projects as Project[];

    this.showCreateProject = !(this.projectList && this.projectList.length > 0);

    this.createFrom();

    if (this.currentOrganization) {
      this.projectForm.get('organization').patchValue(this.currentOrganization.id);
    }

    this.projectSource = [];

    this.modelChanged
      .pipe(
        debounceTime(300))
      .subscribe(() => {
        this.isSearching = true;
        this._projectService.searchProject(this.searchProjectText).subscribe((data)=>{
          this.projectListSearch = data.data
          this.isSearching = false;
        });

      })

    this.projectListSearch = this.projectListData;

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
      organization: ['']
    });
  }

  public removeCollaborators(mem: User) {
    this.selectedCollaborators = this.selectedCollaborators.filter(item => item !== mem);
  }

  public typeaheadOnSelect(e: TypeaheadMatch): void {
    if (this.selectedCollaborators.filter(item => item.emailId === e.item.emailId).length === 0) {
      this.selectedCollaborators.push(e.item);
    }
    this.selectedCollaborator = null;
  }

  public onKeydown(event) {
    if (event.key === 'Enter') {
      const member: User = {
        emailId: this.selectedCollaborator
      };
      this.response = this.validationRegexService.emailValidator(member.emailId);
      if (this.selectedCollaborators.filter(item => item.emailId === member.emailId).length === 0) {
        if (!this.response.invalidEmailAddress) {
          this.selectedCollaborators.push(member);
          this.selectedCollaborator = null;
        }
      }
    }
  }

  public selectOrg(item: Organization) {
    this.projectForm.get('organization').patchValue(item.id);
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
  }

  async saveProject() {
    if (this.projectForm.invalid) {
      this.notification.error('Error', 'Please Enter Project Name');
      return;
    }

    this.createProjectInProcess = true;
    const project: Project = { ...this.projectForm.getRawValue() };
    project.createdBy = this._generalService.user.id;

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
      await this._projectService.addCollaborators(this.createdProjectId, members).toPromise();
      this.addCollaboratorsInProcess = false;
      this.switchStepCurrent++;
    } catch (e) {
      this.addCollaboratorsInProcess = false;
    }
  }

  async addTemplate() {
    this.selectTemplateInProcess = true;
    try {
      await this._projectService.updateProject(this.createdProjectId, { template: this.selectedTemplate }).toPromise();
      this.selectTemplateInProcess = false;
      this.getTasks();
      this.toggleShow.emit();
    } catch (e) {
      this.selectTemplateInProcess = false;
    }
  }

  public getTasks(){
    const json: GetAllTaskRequestModel = {
      projectId: this._generalService.currentProject.id,
      sort: 'createdAt',
      sortBy: 'desc'
    };
    this._taskService.getAllTask(json).subscribe();
  }

  private getAllUsers() {
    this._usersService.getAllUsers().subscribe(res => {
      this.members = res.data;
    }, error => {
      this.members = [];
    });
  }

  ngOnDestroy(): void {
  }
}
