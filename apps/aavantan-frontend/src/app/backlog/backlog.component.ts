import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AddTaskToSprintModel,
  DraftSprint, GetAllSprintRequestModel,
  GetAllTaskRequestModel, GetUnpublishedRequestModel,
  Sprint, SprintBaseRequest, SprintErrorResponse,
  Task,
  User
} from '@aavantan-app/models';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { GeneralService } from '../shared/services/general.service';
import { TaskService } from '../shared/services/task/task.service';
import { TaskQuery } from '../queries/task/task.query';
import { UserQuery } from '../queries/user/user.query';
import { cloneDeep } from 'lodash';
import { NzNotificationService } from 'ng-zorro-antd';
import { SprintService } from '../shared/services/sprint/sprint.service';

@Component({
  selector: 'aavantan-app-backlog',
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss']
})
export class BacklogComponent implements OnInit, OnDestroy {
  public allTaskList: Task[] = [];
  public allTaskListBackup: Task[] = [];
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
  public gettingUnpublishedInProcess: boolean;
  public gettingAllSprintInProcess: boolean;
  public createdSprintId: string = null;
  public publishSprintInProcess: boolean;
  public activeSprintData : Sprint;
  public activeSprintId : string;

  public searchValue: string;
  public searchTaskListInProgress: boolean;


  constructor(private _generalService: GeneralService,
              private _taskService: TaskService,
              private _taskQuery: TaskQuery,
              private _userQuery: UserQuery,
              private _sprintService: SprintService,
              protected notification: NzNotificationService) {
  }

  ngOnInit() {

    this.activeSprintData = this._generalService.currentProject.sprint;
    this.activeSprintId = this._generalService.currentProject.sprintId;

    if(this._generalService.currentProject && this._generalService.currentProject.id) {
      // this.getAllSprint();
      this.getAllBacklogTask();
      this.getUnpublishedSprint();
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
    try {

      this.gettingAllSprintInProcess = true;
      const json: GetAllSprintRequestModel = {
        projectId: this._generalService.currentProject.id
      };

        this._sprintService.getAllSprint(json).subscribe(data=>{
          this.sprintList = data.data.items
          if(this.sprintList && this.sprintList.length>0){
             // this.sprintData = this.sprintList[this.sprintList.length-1]; // uncomment when last sprint not published
          }
        });

      }catch (e) {
        this.gettingAllSprintInProcess = false;
      }

  }

  async getUnpublishedSprint(){
    this.gettingUnpublishedInProcess=true;
    try {
      const json: GetUnpublishedRequestModel = {
        projectId: this._generalService.currentProject.id
      };

      this._sprintService.getUnpublishedSprint(json).subscribe(data => {
        this.gettingUnpublishedInProcess = false;

        if((typeof data.data) === "string"){

        }else{
          this.sprintData = data.data;

          const taskArray : Task[] = [];
          const ids : string[] = [];
          this.sprintData.stages[0].tasks.forEach((ele)=>{
            taskArray.push(ele.task);
            ids.push(ele.task.id);
          });

          this.draftSprint = {
            tasks: taskArray,
            ids: ids
          }
          this.draftData = taskArray;
          if(this.draftData.length>0){
            this.isDisabledCreateBtn = false;
          }
        }

      });
    }catch (e) {
      this.gettingUnpublishedInProcess = false;
    }

  }


  public onChangeSearch(value: any): void {
    this.searchTaskListInProgress = true;
    this.allTaskList = this.allTaskListBackup;
    if(value){
      this.allTaskList = this.allTaskList.filter((ele)=>{
        let taskTypeName = '';
        let profileName = '';
        if(ele.taskType && ele.taskType.name){
          taskTypeName = ele.taskType.name.toLowerCase();
        }
        if(ele.assignee && ele.assignee.firstName || ele.assignee && ele.assignee.lastName){
          profileName = (ele.assignee.firstName + ' ' +ele.assignee.lastName).toLowerCase();
        }
        if(ele.name.toLowerCase().includes(value) || taskTypeName.includes(value) || profileName.includes(value)) {
          return ele;
        }
      });
    }else{
      this.allTaskList = this.allTaskListBackup;
    }
    this.searchTaskListInProgress = false;

  }

  async getAllBacklogTask(){

    const json: GetAllTaskRequestModel = {
      projectId: this._generalService.currentProject.id,
      sort: 'createdAt',
      sortBy: 'desc',
      onlyBackLog: true
    };

    this.getTaskInProcess=true;
    const data = await this._taskService.getAllBacklogTasks(json).toPromise();
    if(data.data && data.data.items.length>0){
      this.allTaskList = cloneDeep(data.data.items);
      this.allTaskListBackup = cloneDeep(data.data.items);
    }

    this.getTaskInProcess = false
    // this._taskQuery.tasks$.pipe(untilDestroyed(this)).subscribe(res => {
    //   if (res) {
    //     this.getTaskInProcess=false;
    //
    //     this.allTaskList = cloneDeep(res);
    //     this.allTaskListBackup = cloneDeep(res);
    //
    //   }
    // });
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

    if(ev.totalCapacity){
      this.sprintData.totalCapacity = ev.totalCapacity;
    }
    if(ev.totalCapacityReadable){
      this.sprintData.totalCapacityReadable = ev.totalCapacityReadable;
    }

    if(ev.totalEstimation){
      this.sprintData.totalEstimation = ev.totalEstimation;
    }

    if(ev.totalEstimationReadable){
      this.sprintData.totalEstimationReadable = ev.totalEstimationReadable;
    }

    if(ev.totalRemainingCapacity){
      this.sprintData.totalRemainingCapacity = ev.totalRemainingCapacity;
    }

    if(ev.totalCapacity){
      this.sprintData.totalRemainingCapacityReadable = ev.totalRemainingCapacityReadable;
    }

    this.draftSprint.tasks = this.getUnique( this.draftSprint.tasks.concat(ev.tasks), 'id');

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

  public toggleAddSprint(data?:Sprint) {
    if(data){
      this.sprintData = data;
    }
    this.sprintModalIsVisible = !this.sprintModalIsVisible;
  }

  async publishSprint() {

    try {

      const sprintData : SprintBaseRequest = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.sprintData.id
      }

      this.publishSprintInProcess = true;
      await this._sprintService.publishSprint(sprintData).toPromise();
      this.publishSprintInProcess = false;

    } catch (e) {
      this.createdSprintId = null;
      this.publishSprintInProcess = false;
    }

  }

  public toggleTeamCapacity(data?:Sprint) {
    if(data){
      this.sprintData = data;
    }
    this.teamCapacityModalIsVisible = !this.teamCapacityModalIsVisible;
  }

  public ngOnDestroy(){

  }

  public getUnique(arr, comp) {

    const unique = arr
      .map(e => e[comp])

      // store the keys of the unique objects
      .map((e, i, final) => final.indexOf(e) === i && i)

      // eliminate the dead keys & store unique objects
      .filter(e => arr[e]).map(e => arr[e]);

    return unique;
  }

}
