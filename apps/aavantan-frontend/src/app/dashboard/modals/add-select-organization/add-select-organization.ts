import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap';
import { ValidationRegexService } from '../../../shared/services/validation-regex.service';
import { Member } from '../../../shared/interfaces/member.interface';

@Component({
  selector: 'aavantan-app-add-select-project',
  templateUrl: './add-select-organization.html',
  styleUrls: ['./add-select-organization.component.css']
})

export class AddSelectOrganization implements OnInit {
  @Input() public modalBasicIsVisible: Boolean = false;
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();
  public modalTitle = 'Select Organization';
  public loading:boolean=true;

  public organizations: any = [
    {name:'App Sphere Softwares', _id:'121212', 'owner':'Owner : Aashish Patil'},
    {name:'App Sphere Enterprises', _id:'131212', 'owner':'Owner : Aashish Patil'}
  ];

  constructor() {
  }

  ngOnInit() {
    setTimeout(()=>{
      this.loading = false;
    },1500);

  }

  selectOrg(item){
    console.log('Selected Org:',item.name);
  }

  basicModalHandleCancel(){
    this.toggleShow.emit();
  }
}
