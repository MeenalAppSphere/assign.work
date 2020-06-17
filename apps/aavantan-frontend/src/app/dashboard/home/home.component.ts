import { Component, ElementRef, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd';
import { Project, Sprint, SprintStatusEnum } from '@aavantan-app/models';
import { GeneralService } from '../../shared/services/general.service';
import * as Highcharts from 'highcharts';
import { SprintReportModel } from '../../../../../../libs/models/src/lib/models/sprint-report.model';
import { SprintReportService } from '../../shared/services/sprint-report/sprint-report.service';
import { SprintService } from '../../shared/services/sprint/sprint.service';
import * as moment from 'moment';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

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
  public isDownloadInProgress:boolean;
  public sprintreportpage:ElementRef;

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

  // Download pdf of selected element 'convert-to-pdf'
  public downloadPDF(){

     try {
       this.isDownloadInProgress = true;

       const data = document.getElementById('sprint-report-page');

       const HTML_Width = document.getElementById('sprint-report-page').offsetWidth;
       const HTML_Height = document.getElementById('sprint-report-page').offsetHeight;
       const top_left_margin = 15;
       const PDF_Width = HTML_Width+(top_left_margin*2);
       const PDF_Height = (PDF_Width*1.5)+(top_left_margin*2);
       const canvas_image_width = HTML_Width;
       const canvas_image_height = HTML_Height;

       const totalPDFPages = Math.ceil(HTML_Height/PDF_Height)-1;


       html2canvas(data,{allowTaint:true}).then((canvas)=> {
         canvas.getContext('2d');

         console.log(canvas.height+"  "+canvas.width);


         const imgData = canvas.toDataURL("image/jpeg", 1.0);
         const pdf = new jsPDF('p', 'pt',  [PDF_Width, PDF_Height]);
         pdf.addImage(imgData, 'JPG', top_left_margin, top_left_margin,canvas_image_width,canvas_image_height);


         for (let i = 1; i <= totalPDFPages; i++) {
           pdf.addPage(PDF_Width, PDF_Height);
           pdf.addImage(imgData, 'JPG', top_left_margin, -(PDF_Height*i)+(top_left_margin*4),canvas_image_width,canvas_image_height);
         }

         this.isDownloadInProgress = false;

         // Generated PDF
         pdf.save(this.sprintReport.sprint.name+'.pdf');

       });


     }catch (e) {
       this.isDownloadInProgress = false;
     }
  }


  public getPDF() {
    try {
      this.isDownloadInProgress = true;

      const element = document.getElementById('report-page-content');

      //const format = [842, 595]; // width, height
      const format = 'a4';

      const option = {
        margin: 1,
        filename:this.sprintReport.sprint.name,
        image : {type:'png', quality: 1},
        html2canvas : {scale:1},
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        jsPDF : { unit: 'pt', format: format, orientation:'p' }
      }

      html2pdf().set(option).from(element).save().then(()=>{
        this.isDownloadInProgress = false;
      });
    }catch (e) {
      this.isDownloadInProgress = false;
    }

  }


  public ngOnDestroy(): void {
    clearInterval(timeInterval);
  }

}
