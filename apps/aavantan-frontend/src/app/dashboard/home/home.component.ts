import { Component, OnInit, TemplateRef } from '@angular/core';
import { AppsService } from '../../shared/services/apps.service';
import { NzModalService } from 'ng-zorro-antd';
import { Project, ProjectTemplateEnum } from '@aavantan-app/models';
import { GeneralService } from '../../shared/services/general.service';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public view: string = 'listView';
  public projectList: Project[];

  constructor(
    private projectListSvc: AppsService,
    private modalService: NzModalService,
    private _generalService: GeneralService
  ) {
  }

  ngOnInit(): void {
    this.projectList = this._generalService.user.projects as Project[];
  }

  showNewProject(newProjectContent: TemplateRef<{}>) {
    const modal = this.modalService.create({
      nzTitle: 'Create New Project',
      nzContent: newProjectContent,
      nzFooter: [
        {
          label: 'Create Project',
          type: 'primary',
          onClick: () =>
            this.modalService.confirm({
              nzTitle: 'Are you sure you want to create this project?',
              nzOnOk: () => this.modalService.closeAll()
            })
        }
      ],
      nzWidth: 800
    });
  }
}
