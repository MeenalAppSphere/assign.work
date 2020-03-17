import { Component, ElementRef, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd';
import { Project, Sprint, SprintStatusEnum } from '@aavantan-app/models';
import { GeneralService } from '../../shared/services/general.service';
import * as Highcharts from 'highcharts';
import { SprintReportModel } from '../../../../../../libs/models/src/lib/models/sprint-report.model';
import { SprintReportService } from '../../shared/services/sprint-report/sprint-report.service';
import { SprintService } from '../../shared/services/sprint/sprint.service';
import * as moment from 'moment';

let timeInterval;

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('currentTime', { static: false }) currentTimeHolder: ElementRef;

  public view: string = 'listView';
  public projectList: Project[];
  public selectedSprint: Partial<Sprint>;
  Highcharts: typeof Highcharts = Highcharts;
  lineChartOptions: Highcharts.Options = {};
  columnChartOptions: Highcharts.Options = {};

  public getReportInProcess: boolean;
  public sprintReport: SprintReportModel = null;
  public closedSprintsList: Partial<Sprint[]> = [];
  public closedSprintsListBackup: Partial<Sprint[]> = [];
  public currentDate: Date;

  public isReportAvailable:boolean;
  public isSprintAvailable:boolean;

  constructor(
    private modalService: NzModalService, private _generalService: GeneralService, private readonly _sprintReportService: SprintReportService,
    private readonly _sprintService: SprintService, private zone: NgZone, private renderer: Renderer2
  ) {
    this.currentDate = new Date();
  }

  ngOnInit(): void {
    if (this._generalService.currentProject && this._generalService.currentProject.sprintId) {
      this.isSprintAvailable = true;
      this.getSprintReport(this._generalService.currentProject.sprint.id, this._generalService.currentProject.sprint.name);
    } else {
      this.isSprintAvailable = false;
      this.setCurrentTimer();
    }

    this.getAllClosedSprints();

    this.projectList = this._generalService.user.projects as Project[];
    this.showLineChart();
    this.showColumnChart();
  }

  private setCurrentTimer() {
    this.zone.runOutsideAngular(() => {
      timeInterval = setInterval(() => {
        this.renderer.setProperty(this.currentTimeHolder.nativeElement, 'textContent', moment().format('hh:mm:ss A'));
      }, 1);
    });
  }

  public async getSprintReport(sprintId:string, sprintName:string) {

    this.getReportInProcess = true;
    try {
      this.selectedSprint = {
        id: sprintId,
        name : sprintName
      }

      this.closedSprintsList = this.closedSprintsListBackup.filter(sprint => sprint.id!==sprintId);

      const report = await this._sprintReportService.getSprintReport(sprintId, this._generalService.currentProject.id).toPromise();
      this.sprintReport = report.data;
      this.isReportAvailable = true;
        this.getReportInProcess = false;

      if (this.sprintReport.sprint.sprintStatus.status === SprintStatusEnum.closed) {
        this.currentDate = this.sprintReport.sprint.sprintStatus.updatedAt;
        clearInterval(timeInterval);
      } else {
        this.currentDate = new Date();
        this.setCurrentTimer();
      }
    } catch (e) {
      this.isReportAvailable = false;
      this.getReportInProcess = false;
      this.setCurrentTimer();
    }
  }

  public async getAllClosedSprints() {
    try {
      const report = await this._sprintService.getAllClosedSprints(this._generalService.currentProject.id).toPromise();
      this.closedSprintsList = report.data;
      this.closedSprintsListBackup = report.data;
    } catch (e) {
      this.closedSprintsList = [];
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

  public ngOnDestroy(): void {
    clearInterval(timeInterval);
  }

}
