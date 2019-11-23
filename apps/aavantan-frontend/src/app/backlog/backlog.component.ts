import { Component, OnDestroy, OnInit } from '@angular/core';
import { DraftSprint, GetAllTaskRequestModel, Sprint, SprintStatusEnum, Task, User } from '@aavantan-app/models';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { GeneralService } from '../shared/services/general.service';
import { TaskService } from '../shared/services/task/task.service';
import { TaskQuery } from '../queries/task/task.query';
import { UserQuery } from '../queries/user/user.query';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'aavantan-app-backlog',
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss']
})
export class BacklogComponent implements OnInit, OnDestroy {
  public allTaskList: Task[] = [];
  public draftTaskList: Task[] = [];
  public taskObj: Task;
  public memberObj: User;
  public view: String = 'listView';
  public totalDuration: Number = 0;
  public isDisabledCreateBtn: boolean = true;
  public draftSprint: DraftSprint;
  public draftData: Task[] = [];
  public showStartWizard: boolean;
  public wizardIndex = 0;
  public wizardTitle = 'Title';
  public projectTeams: User[] = [];
  public dateFormat = 'mm/dd/yyyy';
  public sprintData: any;
  public teamCapacityModalIsVisible: boolean;
  public getTaskInProcess: boolean;
  public sprintDataSource: Sprint[] = [
    {
      id: '1',
      name: 'Sprint 1',
      createdById: '',
      goal: '',
      startedAt: new Date(),
      endAt: new Date(),
      sprintStatus: {
        status: SprintStatusEnum.inProgress,
        updatedAt: new Date()
      }
    },
    {
      id: '2',
      name: 'Sprint 2',
      createdById: '',
      goal: '',
      startedAt: new Date(),
      endAt: new Date(),
      sprintStatus: {
        status: SprintStatusEnum.inProgress,
        updatedAt: new Date()
      }
    },
    {
      id: '3',
      name: 'Sprint 3',
      createdById: '',
      goal: '',
      startedAt: new Date(),
      endAt: new Date(),
      sprintStatus: {
        status: SprintStatusEnum.inProgress,
        updatedAt: new Date()
      }
    }
  ];

  constructor(private _generalService: GeneralService,
              private _taskService: TaskService,
              private _taskQuery: TaskQuery,
              private _userQuery: UserQuery) {
  }

  ngOnInit() {

    this.getAllTask();

    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.projectTeams = res.members;
      }
    });

    if (this.allTaskList && this.allTaskList.length > 0) {
      this.countTotalDuration();
    }

    // dummy sprint wizard data
    this.sprintData = {
      title: 'Sprint 1'
    };

  }

  public getAllTask(){

    const json: GetAllTaskRequestModel = {
      projectId: this._generalService.currentProject.id,
      sort: 'createdAt',
      sortBy: 'desc'
    };
    this._taskService.getAllTask(json).subscribe();

    this._taskQuery.tasks$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.getTaskInProcess=false;

        this.allTaskList = cloneDeep(res);

      }
    });
  }

  public countTotalDuration() {
    this.allTaskList.forEach((ele) => {
      const duration = ele.estimateTime ? ele.estimateTime : 0;
      // @ts-ignore
      this.totalDuration += Number(duration);
    });
  }

  public getTasksSelectedForSprint(ev: DraftSprint) {
    this.draftSprint = ev;
    if (this.draftSprint && this.draftSprint.tasks.length > 0) {
      this.isDisabledCreateBtn = false;
      this.prepareDraftSprint();
    } else {
      this.isDisabledCreateBtn = true;
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

  public ngOnDestroy(){

  }

}
