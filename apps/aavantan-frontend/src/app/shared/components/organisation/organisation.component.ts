import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GetAllTaskRequestModel, Organization, Project, SwitchProjectRequest } from '@aavantan-app/models';
import { OrganizationService } from '../../services/organization/organization.service';
import { GeneralService } from '../../services/general.service';
import { OrganizationQuery } from '../../../queries/organization/organization.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ProjectService } from '../../services/project/project.service';
import { TaskService } from '../../services/task/task.service';

@Component({
  selector: 'aavantan-app-organisation',
  templateUrl: 'organisation.component.html',
  styleUrls: ['organisation.component.scss']
})

export class OrganisationComponent implements OnInit, OnDestroy {
  public orgForm: FormGroup;
  @Input() public organizationModalIsVisible: Boolean = false;
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();

  public modalTitle = 'Organization';
  public organizations: Organization[];
  public showCreateOrg: boolean = true;
  public havePendingInvitations: boolean = true;
  public pendingProjectList: Project[] = [];
  public switchingProjectInProcess: boolean;


  public organizationCreationInProcess: boolean = false;

  constructor(private FB: FormBuilder, private _organizationService: OrganizationService,
              private _generalService: GeneralService,
              private _taskService: TaskService,
              private _projectService: ProjectService, private _organizationQuery: OrganizationQuery) {
  }

  ngOnInit() {
    this.orgForm = this.FB.group({
      name: [null, [Validators.required, Validators.pattern('^[a-zA-Z0-9 ]*$')]],
      description: [null, '']
    });

    this.havePendingInvitations = (!this._generalService.user.currentOrganization && !this._generalService.user.currentProject) &&
      this._generalService.user.projects.length > 0;
    this.pendingProjectList = this._generalService.user.projects as Project[];

    this.organizations = this._generalService.user.projects as Organization[];

    this.showCreateOrg = this.havePendingInvitations ? false : !(this.organizations && this.organizations.length > 0);

    this.modalTitle = this.havePendingInvitations ? 'Pending Invitation(s)' : 'Create Organization';

    // listen for organization creation
    this._organizationQuery.isCreateOrganizationSuccess$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.toggleShow.emit(true);
      }
    });

    // listen for organization creation in process
    this._organizationQuery.isCreateOrganizationInProcess$.pipe(untilDestroyed(this)).subscribe(res => {
      this.organizationCreationInProcess = res;
    });

  }

  public addNewOrg() {
    this.showCreateOrg = true;
    this.havePendingInvitations = false;
  }

  public selectOrg(item: Organization) {
    console.log('Selected Org:', item.name);
  }

  async switchProject(project: Project) {

    const json: SwitchProjectRequest = {
      organizationId: project.organizationId,
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

  public saveForm() {
    const organization: Organization = { ...this.orgForm.getRawValue() };
    organization.createdBy = this._generalService.user.id;
    this._organizationService.createOrganization(organization).subscribe();
  }

  public getTasks() {
    const json: GetAllTaskRequestModel = {
      projectId: this._generalService.currentProject.id,
      sort: 'createdAt',
      sortBy: 'desc'
    };
    this._taskService.getAllTask(json).subscribe();
  }

  closeModal() {
    this.toggleShow.emit();
  }

  ngOnDestroy(): void {
  }

}
