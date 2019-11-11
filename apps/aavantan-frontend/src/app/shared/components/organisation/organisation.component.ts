import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Organization, Project } from '@aavantan-app/models';
import { OrganizationService } from '../../services/organization/organization.service';
import { GeneralService } from '../../services/general.service';
import { OrganizationQuery } from '../../../queries/organization/organization.query';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
  selector: 'aavantan-app-organisation',
  templateUrl: 'organisation.component.html',
  styleUrls: ['organisation.component.scss']
})

export class OrganisationComponent implements OnInit, OnDestroy {
  public orgForm: FormGroup;
  @Input() public organizationModalIsVisible: Boolean = false;
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();

  public modalTitle = 'Create Organization';
  public organizations: Organization[];
  public showCreateOrg:boolean = true;

  public organizationCreationInProcess: boolean = false;

  constructor(private FB: FormBuilder, private _organizationService: OrganizationService,
              private _generalService: GeneralService, private _organizationQuery: OrganizationQuery) {
  }

  ngOnInit() {
    this.orgForm = this.FB.group({
      name: [null, [Validators.required, Validators.pattern('^[a-zA-Z0-9 ]*$')]],
      description: [null, '']
    });

    this.organizations= this._generalService.user.projects as Organization[];

    if (this.organizations && this.organizations.length>0) {
      this.showCreateOrg=false;
    }else{
      this.showCreateOrg=true;
    }

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

  public addNewOrg(){
    this.showCreateOrg=true;
  }

  public selectOrg(item:Organization) {
    console.log('Selected Org:', item.name);
  }

  public saveForm() {
    const organization: Organization = { ...this.orgForm.getRawValue() };
    organization.createdBy = this._generalService.user.id;
    this._organizationService.createOrganization(organization).subscribe();
  }

  closeModal() {
    this.toggleShow.emit();
  }

  ngOnDestroy(): void {
  }

}
