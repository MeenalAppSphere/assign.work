import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'aavantan-app-activesprint',
  templateUrl: './activesprint.component.html',
  styleUrls: ['./activesprint.component.scss']
})
export class ActivesprintComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;
  lineChartOptions: Highcharts.Options = {};
  columnChartOptions: Highcharts.Options = {};

  public itemsSummary = [
    {
      status: 'TO DO',
      items: 5,
      points: 32,
      effortPlanned: 24,
      effortBurned: 20,
      effortRequired: 4
    },
    {
      status: 'In-Progress',
      items: 5,
      points: 32,
      effortPlanned: 24,
      effortBurned: 20,
      effortRequired: 4
    },
    {
      status: 'In-Progress',
      items: 5,
      points: 32,
      effortPlanned: 24,
      effortBurned: 20,
      effortRequired: 4
    },
    {
      status: 'Done',
      items: 5,
      points: 32,
      effortPlanned: 24,
      effortBurned: 20,
      effortRequired: 0
    },
    {
      status: 'In-Progress',
      items: 5,
      points: 32,
      effortPlanned: 24,
      effortBurned: 20,
      effortRequired: 4
    }
  ];

  public sprintItems = [
    {
      itemId: 'ST 1',
      status: 'TO DO',
      description: 'ST1 : Description',
      startDate: 'Jan 2, 2020',
      assignee: 'Pradeep Kumar',
      effortDeviation: 0
    },
    {
      itemId: 'ST 2',
      status: 'In-Progress',
      description: 'ST2 : Description',
      startDate: 'Jan 2, 2020',
      assignee: 'Pradeep Kumar',
      effortDeviation: 2
    },
    {
      itemId: 'ST 3',
      status: 'In-Progress',
      description: 'ST3 : Description',
      startDate: 'Jan 3, 2020',
      assignee: 'Vishal',
      effortDeviation: 16.32
    },
    {
      itemId: 'ST 4',
      status: 'In-Progress',
      description: 'ST3 : Description',
      startDate: 'Jan 3, 2020',
      assignee: 'Vishal',
      effortDeviation: 50
    }
  ];

  constructor() {}

  ngOnInit() {
    this.showLineChart();
    this.showColumnChart();
  }

  public showLineChart() {
    this.lineChartOptions = {
      chart :{
        width:550,
        height:330
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      title: {
        text: ''
      },
      yAxis: {
        title: {
          text: 'Hours'
        }
      },
      xAxis: {
        title: {
          text: 'Days'
        }
      },

      series: [
        {
          color: '#0667FB',
          data: [10, 4, 7, 7, 8, 1, 2, 23, 24, 10, 3],
          type: 'line'
        }
      ]
    };
  }

  public showColumnChart() {
    this.columnChartOptions = {
      chart :{
        width:550,
        height:380
      },
      legend: {
        enabled: true
      },
      credits: {
        enabled: false
      },
      title: {
        text: ''
      },
      yAxis: {
        title: {
          text: 'Hours'
        }
      },
      xAxis: {
        title: {
          text: 'Days'
        }
      },

      series: [
        {
          color: '#0667FB',
          data: [10, 4, 7, 7, 8, 1, 2, 23, 24, 10, 3],
          type:'column'
        },
        {
          color: '#FF1142',
          data: [9, 3, 6, 7, 8, 1, 2, 23, 24, 10, 3],
          type:'column'
        }
      ]
    };
  }
}
