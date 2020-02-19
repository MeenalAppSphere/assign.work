import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';

declare var require: any;
let Boost = require('highcharts/modules/boost');
let noData = require('highcharts/modules/no-data-to-display');
let More = require('highcharts/highcharts-more');

Boost(Highcharts);
noData(Highcharts);
More(Highcharts);
noData(Highcharts);

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

    setTimeout(function() {
      Highcharts.chart('line-chart',
        {
          chart: {
            type: 'scatter',
            height: 700
          },
          title: {
            text: 'Sample Scatter Plot'
          },
          credits: {
            enabled: false
          },


        });
    },10);

  }

}
