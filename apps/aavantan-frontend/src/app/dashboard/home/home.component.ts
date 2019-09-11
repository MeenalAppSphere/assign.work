import { Component } from '@angular/core';

@Component({
    templateUrl: './home.component.html'
})

export class HomeComponent {

  constructor() {}

  //Code Highlight
  tableDataSet = [
    {
      id    : '1',
      title   : 'TASK:110, Theme Setup',
      status: 'Open',
      updatedBy: 'Pradeep'
    },
    {
      id    : '2',
      title   : 'TASK:111, API Setup',
      status: 'Open',
      updatedBy: 'Vishal'
    },
    {
      id    : '1',
      title   : 'TASK:112, DB Setup',
      status: 'Open',
      updatedBy: 'Vishal'
    },
    {
      id    : '1',
      title   : 'TASK:113, Server Setup',
      status: 'Open',
      updatedBy: 'Aashish'
    }
  ];

}  
