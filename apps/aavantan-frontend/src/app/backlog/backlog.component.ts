import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  CreateSprintModel,
  DraftSprint, GetAllSprintRequestModel,
  GetAllTaskRequestModel,
  Project,
  Sprint,
  SprintStatusEnum,
  Task,
  User
} from '@aavantan-app/models';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { GeneralService } from '../shared/services/general.service';
import { TaskService } from '../shared/services/task/task.service';
import { TaskQuery } from '../queries/task/task.query';
import { UserQuery } from '../queries/user/user.query';
import { cloneDeep } from 'lodash';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd';
import { SprintService } from '../shared/services/sprint/sprint.service';

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
  public sprintData: Sprint;
  public sprintList: Sprint[];
  public teamCapacityModalIsVisible: boolean;
  public getTaskInProcess: boolean;
  public sprintForm: FormGroup;
  public createdSprintId: string = null;
  public createSprintInProcess: boolean;

  constructor(private _generalService: GeneralService,
              private _taskService: TaskService,
              private _taskQuery: TaskQuery,
              private _userQuery: UserQuery,
              private _sprintService: SprintService,
              protected notification: NzNotificationService) {
  }

  ngOnInit() {

    if(this._generalService.currentProject && this._generalService.currentProject.id) {
      this.getAllSprint();
      this.getAllTask();
    }

    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.projectTeams = res.members;
      }
    });

    if (this.allTaskList && this.allTaskList.length > 0) {
      this.countTotalDuration();
    }

    this.sprintForm = new FormGroup({
      projectId: new FormControl(this._generalService.currentProject.id, [Validators.required]),
      createdById: new FormControl(this._generalService.user.id, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      goal: new FormControl(null, [Validators.required]),
      sprintStatus: new FormControl(null, []),
      duration: new FormControl(null, [Validators.required]),
      startedAt: new FormControl(null, []),
      endAt: new FormControl(null, []),
    });

    // Sprint wizard data
    this.sprintData = {
      name: null,
      projectId: this._generalService.currentProject.id,
      createdById: this._generalService.user.id,
      goal: null,
      startedAt: null,
      endAt: null,
      sprintStatus:null
    };

  }

  async getAllSprint(){

    const json: GetAllSprintRequestModel = {
      projectId: this._generalService.currentProject.id
    };

    this._sprintService.getAllSprint(json).subscribe(data=>{
      this.sprintList = data.data.items
      if(this.sprintList && this.sprintList.length>0){
        this.sprintData = this.sprintList[0];
      }
    });

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
      const duration = ele.estimatedTime ? ele.estimatedTime : 0;
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

    this.sprintForm.get('name').patchValue(this.sprintData.name);
    this.sprintForm.get('goal').patchValue(this.sprintData.goal);
    this.sprintForm.get('startedAt').patchValue(this.sprintData.startedAt);
    this.sprintForm.get('endAt').patchValue(this.sprintData.endAt);
    this.sprintForm.get('duration').patchValue([this.sprintData.startedAt,this.sprintData.endAt]);

    this.showStartWizard = true;
  }

  public cancel(): void {
    this.showStartWizard = false;
    this.wizardIndex = 0;
    this.sprintForm.reset();
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

  async createSprint() {

    if (this.sprintForm.invalid) {
      this.notification.error('Error', 'Please check all mandatory fields');
      return;
    }

    const sprintForm = this.sprintForm.getRawValue();

    if(sprintForm.duration) {
      sprintForm.startedAt = sprintForm.duration[0];
      sprintForm.endAt = sprintForm.duration[1];
    }

    this.createSprintInProcess = true;
    const sprint: CreateSprintModel = {
      sprint : sprintForm
    };

    try {
      const createdSprint = await this._sprintService.createSprint(sprint).toPromise();

      this.showStartWizard = false;
      this.wizardIndex = 0;
      this.sprintData = createdSprint.data;

      this.createSprintInProcess = false;

    } catch (e) {
      this.createdSprintId = null;
      this.createSprintInProcess = false;
    }

  }

  public publishSprint() {
    console.log('Publish Sprint For Tasks ', this.draftSprint.ids);
  }

  public showTeamCapacity() {
    this.teamCapacityModalIsVisible = !this.teamCapacityModalIsVisible;
  }

  public ngOnDestroy(){

  }

}
