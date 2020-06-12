import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { User } from '@aavantan-app/models';

@Component({
  selector: 'profile-name',
  templateUrl: './profile-name.component.html',
  styleUrls: ['./profile-name.component.scss']
})
export class ProfileNameComponent implements OnInit, OnDestroy {

  @Input() public timelogModalIsVisible: Boolean = false;
  @Input() public user: User;
  @Input() public fullName: boolean;
  @Input() public firstName: boolean;
  @Input() public emailId: boolean;
  @Input() public avatarSize:Number;

  constructor() {
  }

  ngOnInit() {

  }

  ngOnDestroy() {

  }

}
