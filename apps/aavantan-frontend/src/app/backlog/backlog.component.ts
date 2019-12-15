import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AddTaskToSprintModel,
  CreateSprintModel,
  DraftSprint, GetAllSprintRequestModel,
  GetAllTaskRequestModel,
  Project,
  Sprint, SprintErrorResponse,
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
  public durationData:any;
  public isDisabledCreateBtn: boolean = true;
  public draftSprint: DraftSprint;
  public draftData: Task[] = [];
  public sprintModalIsVisible: boolean;
  public projectTeams: User[] = [];
  public sprintData: Sprint;
  public sprintList: Sprint[];
  public teamCapacityModalIsVisible: boolean;
  public getTaskInProcess: boolean;
  public createdSprintId: string = null;
  public publishSprintInProcess: boolean;
  public AddedTaskToSprintData:any;


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
         // this.sprintData = this.sprintList[this.sprintList.length-1]; // uncomment when last sprint not published
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

      this.durationData = this._generalService.secondsToReadable(Number(this.totalDuration));

    });
  }

  public getTasksSelectedForSprint(ev: DraftSprint) {
    this.draftSprint = ev;
    if (this.draftSprint && this.draftSprint.tasks.length > 0) {
      this.isDisabledCreateBtn = false;
    } else {
      this.isDisabledCreateBtn = true;
    }
    this.prepareDraftSprint();
  }

  public prepareDraftSprint() {
    this.draftData = this.draftSprint.tasks.filter((item) => {
      if(item.isSelected){
        return item;
      }
    });
  }

  public toggleAddSprint() {
    this.sprintModalIsVisible = !this.sprintModalIsVisible;
  }

  public editSprint() {
    this.sprintModalIsVisible = true;
  }


  async publishSprint() {

    console.log('Publish Sprint For Tasks ', this.draftSprint.ids);

    try {

      const sprintData : AddTaskToSprintModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.sprintData.id,
        tasks : this.draftSprint.ids
      }

      this.publishSprintInProcess = true;
      const createdSprint = await this._sprintService.addTaskToSprint(sprintData).toPromise();
      this.AddedTaskToSprintData = (createdSprint.data instanceof SprintErrorResponse);
      if(this.AddedTaskToSprintData.tasksErrors && this.AddedTaskToSprintData.tasksErrors.length>0){

        for(let i=0; i<this.draftData.length; i++){
          for(let j=0; j<this.AddedTaskToSprintData.tasksErrors.length; j++){
            if(this.draftData[i].id===this.AddedTaskToSprintData.tasksErrors[j].id){
              this.draftData[i].hasError = this.AddedTaskToSprintData.tasksErrors[j].reason;
            }
          }
        }

        this.draftData = cloneDeep(this.draftData);

      }
      this.publishSprintInProcess = false;

    } catch (e) {
      this.createdSprintId = null;
      this.publishSprintInProcess = false;
    }

  }

  public toggleTeamCapacity() {
    this.teamCapacityModalIsVisible = !this.teamCapacityModalIsVisible;
  }

  public ngOnDestroy(){

  }

}
