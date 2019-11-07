import { Component, OnInit } from '@angular/core';
import { DraftSprint, Sprint, Task, User } from '@aavantan-app/models';

@Component({
  selector: 'aavantan-app-backlog',
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss']
})
export class BacklogComponent implements OnInit {
  public allTaskList: Task[] = [];
  public draftTaskList: Task[] = [];
  public taskObj: Task;
  public memberObj: User;
  public view: String = 'listView';
  public totalDuration: Number = 0;
  public isDisabledCraeteBtn: boolean = true;
  public draftSprint: DraftSprint;
  public draftData: Task[] = [];
  public showStartWizard: boolean;
  public wizardIndex = 0;
  public wizardTitle = 'Title';
  public projectTeams: User[] = [];
  public dateFormat = 'mm/dd/yyyy';
  public sprintData: any;
  public teamCapacityModalIsVisible: boolean;
  public sprintDataSource: Sprint[] = [
    {
      id: '1',
      name: 'Sprint 1'
    },
    {
      id: '2',
      name: 'Sprint 2'
    },
    {
      id: '3',
      name: 'Sprint 3'
    }
  ];

  constructor() {
  }

  ngOnInit() {

    for (let i = 0; i < 50; i++) {
      this.memberObj = {
        id: '1212' + (i + 1),
        emailId: 'abc' + (i + 1) + '@gmail.com',
        firstName: 'Pradeep',
        profilePic: '../../assets/images/avatars/thumb-4.jpg'
      };
      this.taskObj = {
        id: '100' + i,
        displayName: 'BUG-10' + i,
        name: 'You can create sprint by selecting multiple tasks' + i + '.',
        progress: (i * 10),
        createdAt: new Date(),
        description: 'task description here, A responsive table that stacks into cardstask description here, A responsive table that stacks into cards',
        status: 'TO DO',
        assignee: this.memberObj,
        estimateTime: 2,
        priority: 'low',
        sprint: null,
        projectId: '',
        taskType: {
          name: 'bug',
          color: '#ddee00'
        },
        createdById: ''
      };
      this.allTaskList.push(this.taskObj);
    }
    if (this.allTaskList && this.allTaskList.length > 0) {
      this.countTotalDuration();
    }

    // dummy sprint wizard data
    this.sprintData = {
      title: 'Sprint 1'
    };
    this.projectTeams = [{
      id: '1',
      firstName: 'Pradeep',
      profilePic: 'http://themenate.com/enlink/assets/images/avatars/thumb-4.jpg'
    },
      {
        id: '2',
        firstName: 'Vishal',
        profilePic: 'http://themenate.com/enlink/assets/images/avatars/thumb-5.jpg'
      },
      {
        id: '3',
        firstName: 'Aashsih',
        profilePic: 'http://themenate.com/enlink/assets/images/avatars/thumb-6.jpg'
      }];
  }

  public countTotalDuration() {
    this.allTaskList.forEach((ele) => {
      const duration = ele.estimateTime;
      // @ts-ignore
      this.totalDuration += Number(duration);
    });
  }

  public getTasksSelectedForSprint(ev: DraftSprint) {
    this.draftSprint = ev;
    if (this.draftSprint && this.draftSprint.tasks.length > 0) {
      this.isDisabledCraeteBtn = false;
      this.prepareDraftSprint();
    } else {
      this.isDisabledCraeteBtn = true;
    }
  }

  public prepareDraftSprint() {
    this.draftData = this.draftSprint.tasks.filter((item) => {
      return item;
    });
  }

  public startNewSprint() {
    this.showStartWizard = true;
  }

  public editSprint() {
    this.showStartWizard = true;
  }

  public cancel(): void {
    this.showStartWizard = false;
    this.wizardIndex = 0;
    this.changeContent();
  }

  public pre(): void {
    this.wizardIndex -= 1;
    this.changeContent();
  }

  public next(): void {
    this.wizardIndex += 1;
    this.changeContent();
  }

  public done(): void {
    this.showStartWizard = false;
    this.wizardIndex = 0;
    this.sprintData.id = '1';
  }

  changeContent(): void {
    switch (this.wizardIndex) {
      case 0: {
        this.wizardTitle = 'Title and Duration';
        break;
      }
      case 1: {
        this.wizardTitle = 'Team';
        break;
      }
      default: {
        this.wizardTitle = 'error';
      }
    }
  }

  public createSprint() {
    console.log('Create Sprint For Tasks ', this.draftSprint.ids);
  }

  public showTeamCapacity() {
    this.teamCapacityModalIsVisible = !this.teamCapacityModalIsVisible;
  }

}
