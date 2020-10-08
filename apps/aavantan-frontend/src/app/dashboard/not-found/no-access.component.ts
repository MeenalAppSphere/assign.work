import { Component, OnInit } from '@angular/core';
import { UserStore } from '../../store/user/user.store';

@Component({
  templateUrl: './no-access.component.html'
})

export class NoAccessComponent implements OnInit{

  firstName:string;
  lastName:string;
  email:string;
  profilePic:string;

  constructor(private userStore:UserStore){}
  
  ngOnInit() {
    this.firstName=this.userStore._value().currentProject.createdBy.firstName;
    this.lastName=this.userStore._value().currentProject.createdBy.lastName;
    this.email=this.userStore._value().currentProject.createdBy.emailId; 
    this.profilePic=this.userStore._value().currentProject.createdBy.profilePic;
  }
}

