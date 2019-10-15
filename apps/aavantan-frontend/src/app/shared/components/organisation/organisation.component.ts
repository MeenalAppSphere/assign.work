import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'aavantan-app-organisation',
  templateUrl: 'organisation.component.html',
  styleUrls:['organisation.component.scss']
})

export class OrganisationComponent implements OnInit {
  public orgForm: FormGroup;
  @Input() public organizationModalIsVisible: Boolean = false;
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();
  public modalTitle = 'Create Organisation';
  public organizations: any = [
    // {
    //   name: 'App Sphere Softwares',
    //   id: '121212',
    //   owner: 'Owner : Aashish Patil'
    // },
    // {
    //   name: 'App Sphere Enterprises',
    //   id: '131212',
    //   owner: 'Owner : Aashish Patil'
    // }
  ];

  constructor(private FB: FormBuilder) {
  }

  ngOnInit() {
      this.orgForm = this.FB.group({
      organizationName : [ null, [ Validators.required, Validators.pattern('^$|^[A-Za-z0-9]+')]],
      organizationDescription:[null, '']
    });
  }

  public selectOrg(item) {
    console.log('Selected Org:', item.name);
  }
  public saveForm(){
    console.log('Save :', this.modalTitle)
  }
  basicModalHandleCancel(){
    this.toggleShow.emit();
  }

}
