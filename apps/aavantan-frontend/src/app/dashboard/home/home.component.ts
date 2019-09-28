import { Component, OnInit, TemplateRef } from '@angular/core';
import { AppsService } from '../../shared/services/apps.service';
import { NzModalService } from 'ng-zorro-antd';
import { ProjectList } from '../../shared/interfaces/project-list.type';
import { JoyrideService } from 'ngx-joyride';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
  templateUrl: './home.component.html',
  styleUrls:['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public view: String = 'cardView';
  public newProject: Boolean = false;
  public projectList: ProjectList[];

  constructor(
    private projectListSvc: AppsService,
    private modalService: NzModalService,
    private joyrideService: JoyrideService
  ) {}

  ngOnInit(): void {

    this.projectList = [
      {
        project: 'Mind Cog App',
        avatar: 'assets/images/others/thumb-1.jpg',
        status: 'Ready',
        tasks: '31',
        desc: 'European minnow priapumfish mosshead warbonnet shrimpfish.',
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
      },
      {
        project: 'Fortier Studio',
        avatar: 'assets/images/others/thumb-5.jpg',
        status: 'In Progress',
        tasks: '68',
        desc: 'Let us wax poetic about the beauty of the cheeseburger.',
        progress: 73,
        member: [
          {
            avatar: 'assets/images/avatars/thumb-1.jpg',
            name: 'Erin Gonzales'
          },
          {
            avatar: 'assets/images/avatars/thumb-10.jpg',
            name: 'Lilian Stone'
          }
        ]
      },
      {
        project: 'Indi Wheel Web',
        avatar: 'assets/images/others/thumb-6.jpg',
        status: 'In Progress',
        tasks: '68',
        desc:
          "Here's the story of a man named Brady who was busy with three boys",
        progress: 62,
        member: [
          {
            avatar: 'assets/images/avatars/thumb-4.jpg',
            name: 'Virgil Gonzales'
          },
          {
            avatar: 'assets/images/avatars/thumb-2.jpg',
            name: 'Darryl Day'
          },
          {
            avatar: 'assets/images/avatars/thumb-1.jpg',
            name: 'Erin Gonzales'
          },
          {
            avatar: 'assets/images/avatars/thumb-1.jpg',
            name: 'Erin Gonzales'
          }
        ]
      },
      {
        project: 'Austin Lab',
        avatar: 'assets/images/others/thumb-7.jpg',
        status: 'In Progress',
        tasks: '90',
        desc: 'Caerphilly swiss fromage frais. Brie cheese and wine fromage.',
        progress: 62,
        member: [
          {
            avatar: 'assets/images/avatars/thumb-8.jpg',
            name: 'Lilian Stone'
          },
          {
            avatar: 'assets/images/avatars/thumb-9.jpg',
            name: 'Victor Terry'
          }
        ]
      },
      {
        project: 'Moody Agency',
        avatar: 'assets/images/others/thumb-8.jpg',
        status: 'Behind',
        tasks: '165',
        desc: 'Do you see any Teletubbies in here? The path of the righteous.',
        progress: 28,
        member: [
          {
            avatar: 'assets/images/avatars/thumb-8.jpg',
            name: 'Lilian STone'
          },
          {
            avatar: 'assets/images/avatars/thumb-2.jpg',
            name: 'Darryl Day'
          },
          {
            avatar: 'assets/images/avatars/thumb-7.jpg',
            name: 'Pamela Wanda'
          },
          {
            avatar: 'assets/images/avatars/thumb-2.jpg',
            name: 'Darryl Day'
          },
          {
            avatar: 'assets/images/avatars/thumb-7.jpg',
            name: 'Pamela Wanda'
          }
        ]
      }
    ];

    setTimeout(()=>{
      this.startTour();
    },100);

  }

  onPrev() {
    console.log('Prev Clicked');
  }

  stepDone() {
    setTimeout(() => {
      console.log('Step done!');
    }, 3000);
  }

  startTour() {
    const options = {
      steps: ['tour1', 'tour-card2', 'tour3',"board@dashboard/board"],
      startWith: 'tour1',
      // waitingTime: 2000,
      stepDefaultPosition: 'top',
      themeColor: '#000000',
      showPrevButton: true,
      logsEnabled: true,
      customTexts: { prev: of('<<').pipe(delay(2000)), next: '>>' }
    };
    this.joyrideService.startTour(options).subscribe(
      step => {
        console.log('Next:', step);
      },
      e => {
        console.log('Error', e);
      },
      () => {
        this.stepDone();
        console.log('Tour finished');
      }
    );
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
