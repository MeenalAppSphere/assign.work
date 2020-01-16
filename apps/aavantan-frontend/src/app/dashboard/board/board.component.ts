import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  CloseSprintModel,
  GetAllTaskRequestModel,
  MoveTaskToStage,
  Sprint,
  SprintStage,
  SprintStatusEnum,
  Task
} from '@aavantan-app/models';
import { GeneralService } from '../../shared/services/general.service';
import { SprintService } from '../../shared/services/sprint/sprint.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskService } from '../../shared/services/task/task.service';

@Component({
  selector: 'aavantan-app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {

  public boardData: Sprint;
  public timelogModalIsVisible: boolean;
  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  public selectedTaskItem:Task;
  public getStageInProcess: boolean;
  public sprintCloseInProcess:boolean;
  public activeSprintData:Sprint;
  public sprintDataSource:Sprint[] = [
    {
      id: '1',
      name: 'Sprint 1',
      projectId: '',
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
      projectId: '',
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
      projectId: '',
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
              private _sprintService: SprintService,
              protected notification: NzNotificationService) { }

  ngOnInit() {

    this.activeSprintData = this._generalService.currentProject.sprint;

    if(this._generalService.currentProject.sprintId && this._generalService.currentProject.id){
      this.getBoardData();
    }else{
      this.notification.info('Info', 'Sprint not found');
    }
  }

  async getBoardData(){
    try{

      const json: GetAllTaskRequestModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this._generalService.currentProject.sprintId
      };

      this.getStageInProcess = true;
      const data = await this._sprintService.getBoardData(json).toPromise();
      if(data.data){

        data.data.stages.forEach((stage)=>{
          stage.tasks.forEach((task)=>{
            if(!task.task.priority){
              task.task.priority = {
                name :null,
                color:'#6E829C'
              }
            }
            if(!task.task.taskType){
              task.task.taskType = {
                name :null,
                color:'#6E829C'
              }
            }
          })
        })
        this.boardData = data.data;
      }
      this.getStageInProcess = false;
    }catch (e) {
      this.getStageInProcess = false;
    }

  }

  public moveTask(ev:any, stageId:string){
    try{

    const json: MoveTaskToStage = {
      projectId : this._generalService.currentProject.id,
      sprintId: this.activeSprintData.id,
      stageId: stageId,
      taskId: ev.toElement.firstElementChild.id
    }

    this._sprintService.moveTaskToStage(json).toPromise();
    }catch (e) {

    }
  }

  //============ close sprint =============//
  async closeSprint(){

    try{

      this.sprintCloseInProcess = true;
      const json :CloseSprintModel ={
        projectId: this._generalService.currentProject.id,
        sprintId: this._generalService.currentProject.sprintId,
      }

      const data = await this._sprintService.closeSprint(json).toPromise();
      console.log('Sprint close', data);
      this.sprintCloseInProcess = false;

    }catch (e) {
      this.sprintCloseInProcess = false;
    }

  }


  public timeLog(item:Task) {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
    this.selectedTaskItem=item;
  }

}
