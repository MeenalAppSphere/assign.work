import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'aavantan-app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
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
