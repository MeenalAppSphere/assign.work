import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'aavantan-app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit {
  @Input() public enablePinButton:Boolean=false;
  public data = [
    {
      firstName: 'Pradeep',
      createdAt : new Date(),
      profilePic:'./../../assets/images/avatars/thumb-8.jpg',
      description:'Ant Design, a design language for background applications, is refined by Ant UED TeamAnt Design....',
      pinned:true
    },
    {
      firstName: 'Vishal',
      createdAt : new Date(),
      profilePic:'./../../assets/images/avatars/thumb-8.jpg',
      description:'Ant Design, a design language for background applications, is refined by Ant UED TeamAnt Design, a design language for background applications, is refined by Ant UED TeamAnt Design, a design language for background applications, is refined by Ant UED TeamAnt Design, a design language for background applications, is refined by Ant UED Team',
      pinned:false
    },
    {
      firstName: 'Vishal',
      createdAt : new Date(),
      profilePic:'./../../assets/images/avatars/thumb-7.jpg',
      description:'Ant Design, a design language for background applicationsAnt Design, a design language for background applicationsAnt Design, a design language for background applications, is refined by Ant UED TeamAnt Design, a design language for background applications, is refined by Ant UED TeamAnt Design, a design language for background applications, is refined by Ant UED TeamAnt Design, a design language for background applications, is refined by Ant UED Team',
      pinned:false
    }
  ];
  constructor() { }

  ngOnInit() {
  }

}
