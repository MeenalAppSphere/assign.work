import { Component, ElementRef, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd';
import { Project, Sprint, SprintStatusEnum } from '@aavantan-app/models';
import { GeneralService } from '../../shared/services/general.service';
import { SprintReportModel } from '../../../../../../libs/models/src/lib/models/sprint-report.model';
import { SprintReportService } from '../../shared/services/sprint-report/sprint-report.service';
import { SprintService } from '../../shared/services/sprint/sprint.service';
import * as moment from 'moment';
import html2pdf from 'html2pdf.js';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserQuery } from '../../queries/user/user.query';

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
  public getReportInProcess: boolean;
  public sprintReport: SprintReportModel = null;
  public closedSprintsList: Partial<Sprint[]> = [];
  public closedSprintsListBackup: Partial<Sprint[]> = [];
  public currentDate: Date;

  public isReportAvailable: boolean;
  public isSprintAvailable: boolean;
  public isDownloadInProgress: boolean;
  public currentProject: Project;
  public boardData: Sprint;
  

  constructor(
    private modalService: NzModalService, private _generalService: GeneralService, private readonly _sprintReportService: SprintReportService,
    private readonly _sprintService: SprintService, private zone: NgZone, private renderer: Renderer2,
    private _userQuery: UserQuery
  ) {
    this.currentDate = new Date();
  }

  ngOnInit(): void {

    this._userQuery.currentProject$
      .pipe(untilDestroyed(this))
      .subscribe(project => {
        this.currentProject = project;

        if (this.currentProject && this.currentProject.sprintId) {
          this.isSprintAvailable = true;
          this.getSprintReport(this.currentProject.sprint.id, this.currentProject.sprint.name);
        } else {
          this.isSprintAvailable = false;
          this.isReportAvailable = false;
          this.selectedSprint = null;
          this.setCurrentTimer();
        }

        this.getAllClosedSprints();
      });

    this.projectList = this._generalService.user.projects as Project[];
  }

  private setCurrentTimer() {
    this.zone.runOutsideAngular(() => {
      timeInterval = setInterval(() => {
        this.renderer.setProperty(this.currentTimeHolder.nativeElement, 'textContent', moment().format('hh:mm:ss A'));
      }, 1);
    });
  }

  public async getSprintReport(sprintId: string, sprintName: string) {

    this.getReportInProcess = true;
    try {
      this.selectedSprint = {
        id: sprintId,
        name: sprintName
      };

      this.closedSprintsList = this.closedSprintsListBackup.filter(sprint => sprint.id !== sprintId);

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
      const sprintData = this.currentProject.sprint ? [this.currentProject.sprint, ...report.data] : report.data;
      this.closedSprintsList = sprintData;
      this.closedSprintsListBackup = sprintData;
    } catch (e) {
      this.closedSprintsList = [];
    }
  }

  public selectSprint(item: Sprint) {
    this.selectedSprint = item;
  }

  public getPDF() {
    try {
      this.isDownloadInProgress = true;

      const element = document.getElementById('report-page-content');

      //const format = [842, 595]; // width, height
      const format = 'a3';

      const option = {
        margin: 1,
        filename: this.sprintReport.sprint.name,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 1 },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        jsPDF: { unit: 'pt', format: format, orientation: 'p' }
      };

      html2pdf().set(option).from(element).save().then(() => {
        this.isDownloadInProgress = false;
      });
    } catch (e) {
      this.isDownloadInProgress = false;
    }

  }


  public ngOnDestroy(): void {
    clearInterval(timeInterval);
  }

}
