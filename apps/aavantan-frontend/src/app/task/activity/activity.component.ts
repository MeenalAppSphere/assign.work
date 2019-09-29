import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'aavantan-app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.css']
})
export class ActivityComponent implements OnInit {
  public data = [
    {
      firstName: 'Pradeep',
      createdAt : new Date(),
      profilePic:'./../../assets/images/avatars/thumb-8.jpg',
      description:'Ant Design, a design language for background applications, is refined by Ant UED TeamAnt Design....'
    },
    {
      firstName: 'Vishal',
      createdAt : new Date(),
      profilePic:'./../../assets/images/avatars/thumb-8.jpg',
      description:'Ant Design, a design language for background applications, is refined by Ant UED TeamAnt Design, a design language for background applications, is refined by Ant UED TeamAnt Design, a design language for background applications, is refined by Ant UED TeamAnt Design, a design language for background applications, is refined by Ant UED Team'
    }
  ];
  constructor() { }

  ngOnInit() {
  }

}
