import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap';
import { ValidationRegexService } from '../../services/validation-regex.service';
import { Organization, Project, ProjectMembers, ProjectTemplateEnum, User } from '@aavantan-app/models';
import { GeneralService } from '../../services/general.service';
import { UserService } from '../../services/user.service';
import { ProjectService } from '../../services/project.service';


@Component({
  selector: 'aavantan-app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit, OnDestroy {
  @Input() public projectModalIsVisible: boolean = false;
  @Input() public selectedOrgId: string;
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();

  public projectForm: FormGroup;
  public switchStepCurrent = 1;
  public modalTitle = 'Project Details';
  public selectedCollaborators: User[] = [];
  public selectedCollaborator: string;
  public selectedTemplate: ProjectTemplateEnum = ProjectTemplateEnum.software;
  public response: any;

  public organizations: Organization[];
  public organizationCreationInProcess: boolean = false;

  public createProjectInProcess: boolean = false;
  public createdProjectId: string = null;

  public addCollaboratorsInProcess: boolean = false;
  public selectTemplateInProcess: boolean = false;

  public members: User[] = [];

  constructor(private FB: FormBuilder, private validationRegexService: ValidationRegexService,
              private _generalService: GeneralService, private _usersService: UserService, private _projectService: ProjectService) {
    this.getAllUsers();
  }

  ngOnInit() {
    this.organizations = this._generalService.user && this._generalService.user.organizations as Organization[] || [];
    this.createFrom();

    if (this.selectedOrgId) {
      this.projectForm.get('organization').patchValue(this.selectedOrgId);
    }
  }

  public createFrom() {
    this.projectForm = this.FB.group({
      name: [null, [Validators.required, Validators.pattern('^$|^[A-Za-z0-9]+')]],
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

  next(): void {
    if (this.switchStepCurrent === 1) {
      // save project
      this.saveProject();
    } else if (this.switchStepCurrent === 2) {
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
      await this._projectService.addCollaborators(this.createdProjectId, members);
      this.addCollaboratorsInProcess = false;
      this.switchStepCurrent++;
    } catch (e) {
      this.addCollaboratorsInProcess = false;
    }
  }

  async addTemplate() {
    this.selectTemplateInProcess = true;
    try {
      await this._projectService.updateProject(this.createdProjectId, { template: this.selectedTemplate });
      this.selectTemplateInProcess = false;
      this.toggleShow.emit();
    } catch (e) {
      this.selectTemplateInProcess = false;
    }
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
