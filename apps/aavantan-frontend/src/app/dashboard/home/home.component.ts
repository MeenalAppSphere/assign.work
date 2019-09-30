import { Component, OnInit, TemplateRef } from '@angular/core';
import { AppsService } from '../../shared/services/apps.service';
import { NzModalService } from 'ng-zorro-antd';
import { ProjectList } from '../../shared/interfaces/project-list.type';

@Component({
  templateUrl: './home.component.html',
  styleUrls:['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public view: String = 'listView';
  public newProject: Boolean = false;
  public projectList: ProjectList[];

  constructor(
    private projectListSvc: AppsService,
    private modalService: NzModalService
  ) {}

  ngOnInit(): void {

    this.projectList = [
      {
        project: 'Mind Cog App',
        avatar: 'assets/images/others/thumb-1.jpg',
        status: 'Ready',
        tasks: '31',
        desc: 'European minnow priapumfish mosshead warbonnet shrimpfish. European minnow priapumfish mosshead warbonnet shrimpfish.',
        progress: 100,
        member: [
          {
            avatar: 'assets/images/avatars/thumb-7.jpg',
            name: 'Pamela Wanda'
          },
          {
            avatar: 'assets/images/avatars/thumb-2.jpg',
            name: 'Darryl Day'
          }
        ]
      },
      {
        project: 'Mill Real Estate',
        avatar: 'assets/images/others/thumb-2.jpg',
        status: 'Ready',
        tasks: '56',
        desc:
          'Efficiently unleash cross-media information without cross-media value.',
        progress: 100,
        member: [
          {
            avatar: 'assets/images/avatars/thumb-4.jpg',
            name: 'Virgil Gonzales'
          },
          {
            avatar: 'assets/images/avatars/thumb-1.jpg',
            name: 'Erin Gonzales'
          },
          {
            avatar: 'assets/images/avatars/thumb-5.jpg',
            name: 'Nicole Wyne'
          },
          {
            avatar: 'assets/images/avatars/thumb-5.jpg',
            name: 'Nicole Wyne'
          }
        ]
      },
      {
        project: 'Eastern Sack',
        avatar: 'assets/images/others/thumb-3.jpg',
        status: 'In Progress',
        tasks: '21',
        desc: 'Jelly-o sesame snaps halvah croissant oat cake cookie.',
        progress: 87,
        member: [
          {
            avatar: 'assets/images/avatars/thumb-10.jpg',
            name: 'Lilian Stone'
          },
          {
            avatar: 'assets/images/avatars/thumb-11.jpg',
            name: 'Victor Terry'
          },
          {
            avatar: 'assets/images/avatars/thumb-12.jpg',
            name: 'Wilma Young'
          },
          {
            avatar: 'assets/images/avatars/thumb-11.jpg',
            name: 'Victor Terry'
          },
          {
            avatar: 'assets/images/avatars/thumb-12.jpg',
            name: 'Wilma Young'
          }
        ]
      },
      {
        project: 'Good Beat',
        avatar: 'assets/images/others/thumb-4.jpg',
        status: 'In Progress',
        tasks: '38',
        desc:
          'Irish skinny, grinder affogato, dark, sweet carajillo flavour seasonal.',
        progress: 73,
        member: [
          {
            avatar: 'assets/images/avatars/thumb-3.jpg',
            name: 'Marshall Nichols'
          },
          {
            avatar: 'assets/images/avatars/thumb-7.jpg',
            name: 'Pamela Wanda'
          }
        ]
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
