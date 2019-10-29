import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Organization, User } from '@aavantan-app/models';

@Component({
  selector: 'aavantan-team-capacity',
  templateUrl: './team-capacity.component.html',
  styleUrls: ['./team-capacity.component.scss']
})
export class TeamCapacityComponent implements OnInit {
  @Input() public teamCapacityModalIsVisible: boolean;
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
        lastName: 'Kumar',
        profilePic:
          'http://themenate.com/enlink/assets/images/avatars/thumb-4.jpg'
      },
      {
        id: '2',
        firstName: 'Vishal',
        lastName: 'Kumar',
        profilePic:
          'http://themenate.com/enlink/assets/images/avatars/thumb-5.jpg'
      },
      {
        id: '3',
        firstName: 'Aashsih',
        lastName: 'Patil',
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
