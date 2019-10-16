import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap';
import { ValidationRegexService } from '../../services/validation-regex.service';
import { Organization, Project, ProjectTemplateEnum, User } from '@aavantan-app/models';
import { OrganizationService } from '../../services/organization.service';
import { GeneralService } from '../../services/general.service';
import { OrganizationQuery } from '../../../queries/organization/organization.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserService } from '../../services/user.service';


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
  public collaboratorForm: FormGroup;
  public swicthStepCurrent = 1;
  public modalTitle = 'Project Details';
  public radioValue = 'A';
  public selectedCollaborators: User[] = [];
  public selectedCollaborator: string;
  public response: any;

  public organizations: Organization[];
  public organizationCreationInProcess: boolean = false;

  public members: User[] = [];

  constructor(private FB: FormBuilder, private validationRegexService: ValidationRegexService,
              private _generalService: GeneralService, private _usersService: UserService) {
    this.getAllUsers();
  }

  ngOnInit() {
    this.organizations = this._generalService.user.organizations as Organization[];
    this.createFrom();

    if (this.selectedOrgId) {
      this.projectForm.get('organization').patchValue(this.selectedOrgId);
    }
  }

  public createFrom() {
    this.projectForm = this.FB.group({
      name: [null, [Validators.required, Validators.pattern('^$|^[A-Za-z0-9]+')]],
      description: [null],
      organization: [null, Validators.required],
      template: [ProjectTemplateEnum.software, Validators.required],
      members: []
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
    this.swicthStepCurrent -= 1;
    this.changeContent();
  }

  next(): void {
    this.swicthStepCurrent += 1;
    this.changeContent();
  }


  basicModalHandleCancel() {
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
  }

  saveForm() {
    const project: Project = { ...this.projectForm.getRawValue() };
    project.createdBy = this._generalService.user.id;
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
