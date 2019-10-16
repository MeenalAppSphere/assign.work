import { Component, OnInit, TemplateRef } from '@angular/core';
import { AppsService } from '../../shared/services/apps.service';
import { NzModalService } from 'ng-zorro-antd';
import { Project, ProjectTemplateEnum } from '@aavantan-app/models';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public view: String = 'listView';
  public newProject: Boolean = false;
  public projectList: Project[];

  constructor(
    private projectListSvc: AppsService,
    private modalService: NzModalService
  ) {
  }

  ngOnInit(): void {
    this.projectList = [
      {
        name: 'Mind Cog App',
        avatar: 'assets/images/others/thumb-1.jpg',
        status: 'Ready',
        desc:
          'European minnow priapumfish mosshead warbonnet shrimpfish. European.',
        progress: 100,
        members: [
          {
            userId: '1',
            emailId: 'pradeep@appsphere.in',
            isEmailSent: true,
            isInviteAccepted: true,
            userDetails: {
              id: '1',
              profilePic: 'assets/images/avatars/thumb-1.jpg',
              firstName: 'Pradeep'
            }
          },
          {
            userId: '2',
            emailId: 'vishal@appsphere.in',
            isEmailSent: true,
            isInviteAccepted: false,
            userDetails: {
              id: '2',
              profilePic: 'assets/images/avatars/thumb-2.jpg',
              firstName: 'Vishal'
            }
          },
          {
            userId: '3',
            emailId: 'aashish.patil@appsphere.in',
            isEmailSent: true,
            isInviteAccepted: false,
            userDetails: {
              id: '2',
              profilePic: 'assets/images/avatars/thumb-2.jpg',
              firstName: 'Aashish'
            }
          }
        ],
        organization: '',
        template: ProjectTemplateEnum.software
      }
    ];
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
