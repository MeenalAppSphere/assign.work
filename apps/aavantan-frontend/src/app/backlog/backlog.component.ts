import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AddTaskToSprintModel,
  DraftSprint, GetAllSprintRequestModel,
  GetAllTaskRequestModel, GetUnpublishedRequestModel,
  Sprint, SprintErrorResponse,
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
  public AddedTaskToSprintData:any;
  public taskMessage:string = '0';

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

    if(this._generalService.currentProject && this._generalService.currentProject.id) {
      // this.getAllSprint();
      this.getAllTask();
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
        console.log(typeof data.data);
        if((typeof data.data) === "string"){

        }else{
          this.sprintData = data.data;

          const taskArray : Task[] = [];
          this.sprintData.stages[0].tasks.forEach((ele)=>{
            taskArray.push(ele.task);
          });

          this.draftSprint = {
            tasks: taskArray
          }
          this.draftData = taskArray;
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
        this.allTaskListBackup = cloneDeep(res);

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

    console.log('Publish Sprint For Tasks ', this.draftSprint);

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
