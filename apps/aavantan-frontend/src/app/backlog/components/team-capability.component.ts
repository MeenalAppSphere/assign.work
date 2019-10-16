import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Organization, User } from '@aavantan-app/models';

@Component({
  selector: 'aavantan-team-capability',
  templateUrl: './team-capability.component.html',
  styleUrls: ['./team-capability.component.scss']
})
export class TeamCapabilityComponent implements OnInit {
  @Input() public teamCapabilityModalIsVisible: boolean;
  @Output() toggleShow: EventEmitter<any> = new EventEmitter<any>();
  public response: any;
  public organizations: Organization[];
  public sprintMembers: User[] = [];

  constructor() {}

  ngOnInit() {
    this.sprintMembers = [
      {
        id: '1',
        firstName: 'Pradeep',
        profilePic:
          'http://themenate.com/enlink/assets/images/avatars/thumb-4.jpg'
      },
      {
        id: '2',
        firstName: 'Vishal',
        profilePic:
          'http://themenate.com/enlink/assets/images/avatars/thumb-5.jpg'
      },
      {
        id: '3',
        firstName: 'Aashsih',
        profilePic:
          'http://themenate.com/enlink/assets/images/avatars/thumb-6.jpg'
      }
    ];
  }

  public saveForm(){

  }
  public basicModalHandleCancel() {
    this.toggleShow.emit();
  }
}
