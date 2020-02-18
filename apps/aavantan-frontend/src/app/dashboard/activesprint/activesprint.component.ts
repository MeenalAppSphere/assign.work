import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'aavantan-app-activesprint',
  templateUrl: './activesprint.component.html',
  styleUrls: ['./activesprint.component.scss']
})
export class ActivesprintComponent implements OnInit {

  public itemsSummary = [
    {
      status: 'TO DO',
      items: 5,
      points: 32,
      effortPlanned: 24,
      effortBurned:20,
      effortRequired:4
    },
    {
      status: 'In-Progress',
      items: 5,
      points: 32,
      effortPlanned: 24,
      effortBurned:20,
      effortRequired:4
    },
    {
      status: 'In-Progress',
      items: 5,
      points: 32,
      effortPlanned: 24,
      effortBurned:20,
      effortRequired:4
    },
    {
      status: 'Done',
      items: 5,
      points: 32,
      effortPlanned: 24,
      effortBurned:20,
      effortRequired:0
    },
    {
      status: 'In-Progress',
      items: 5,
      points: 32,
      effortPlanned: 24,
      effortBurned:20,
      effortRequired:4
    }
  ];

  public sprintItems = [
    {
      itemId: 'ST 1',
      status: 'TO DO',
      description: 'ST1 : Description',
      startDate: 'Jan 2, 2020',
      assignee:'Pradeep Kumar',
      effortDeviation: 0
    },
    {
      itemId: 'ST 2',
      status: 'In-Progress',
      description: 'ST2 : Description',
      startDate: 'Jan 2, 2020',
      assignee:'Pradeep Kumar',
      effortDeviation: 2
    },
    {
      itemId: 'ST 3',
      status: 'In-Progress',
      description: 'ST3 : Description',
      startDate: 'Jan 3, 2020',
      assignee:'Vishal',
      effortDeviation: 16.32
    },
    {
      itemId: 'ST 4',
      status: 'In-Progress',
      description: 'ST3 : Description',
      startDate: 'Jan 3, 2020',
      assignee:'Vishal',
      effortDeviation: 50
    }];

  constructor() { }

  ngOnInit() {
  }

}
