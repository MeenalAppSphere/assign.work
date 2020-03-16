import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd';
import { Project, Sprint } from '@aavantan-app/models';
import { GeneralService } from '../../shared/services/general.service';
import * as Highcharts from 'highcharts';
import { SprintReportModel } from '../../../../../../libs/models/src/lib/models/sprint-report.model';
import { SprintReportService } from '../../shared/services/sprint-report/sprint-report.service';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public view: string = 'listView';
  public projectList: Project[];
  public selectedSprint: Sprint;
  public sprintDataSource: Sprint[] = [];

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
  public getReportInProcess: boolean;
  public sprintReport: SprintReportModel = new SprintReportModel();

  constructor(
    private modalService: NzModalService, private _generalService: GeneralService, private readonly _sprintReportService: SprintReportService
  ) {
  }

  ngOnInit(): void {
    if (this._generalService.currentProject && this._generalService.currentProject.sprintId) {
      this.getSprintReport(this._generalService.currentProject.sprintId);
    }

    this.projectList = this._generalService.user.projects as Project[];
    this.showLineChart();
    this.showColumnChart();

    this.selectedSprint = this.sprintDataSource[0];
  }

  public async getSprintReport(sprintId: string) {
    this.getReportInProcess = true;
    try {
      const report = await this._sprintReportService.getSprintReport(sprintId, this._generalService.currentProject.id).toPromise();
      this.sprintReport = report.data;
    } catch (e) {
      this.getReportInProcess = false;
    }
  }

  public showLineChart() {
    this.lineChartOptions = {
      chart: {
        width: 550,
        height: 330
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
      chart: {
        width: 550,
        height: 380
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
          name: 'Sprint 1',
          color: '#0667FB',
          data: [10, 4, 7, 7, 8, 1, 2, 23, 24, 10, 3],
          type: 'column'
        },
        {
          name: 'Sprint 2',
          color: '#FF1142',
          data: [9, 3, 6, 7, 8, 1, 2, 23, 24, 10, 3],
          type: 'column'
        }
      ]
    };
  }

  public selectSprint(item: Sprint) {
    this.selectedSprint = item;
  }
}
