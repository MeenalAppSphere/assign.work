import { Component, Input, OnInit } from '@angular/core';
import { BaseResponseModel, TaskComments, User } from '@aavantan-app/models';
import { TaskService } from '../../shared/services/task/task.service';

@Component({
  selector: 'aavantan-app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit {
  @Input() public enablePinButton:Boolean=false;
  @Input() public  taskId:string;

  public pinInProcess: boolean = false;
  public getCommentInProcess:boolean = false;

  public data: BaseResponseModel<TaskComments[]>;
  //   [{
  //     id:'1',
  //     createdBy :{
  //       id:'1',
  //       firstName: 'Pradeep',
  //       profilePic:'./../../assets/images/avatars/thumb-8.jpg',
  //     },
  //     createdAt : new Date(),
  //     comment:'Ant Design, a design language for background applications, is refined by Ant UED TeamAnt Design....',
  //     isPinned:true,
  //     attachments:null
  //   },
  //   {
  //     id:'2',
  //     createdBy :{
  //       id:'1',
  //       firstName: 'Pradeep',
  //       profilePic:'./../../assets/images/avatars/thumb-8.jpg',
  //     },
  //     createdAt : new Date(),
  //     comment:'Ant Design, a design language for background applications, is refined by Ant UED TeamAnt Design....',
  //     isPinned:false,
  //     attachments:null
  //   },{
  //     id:'3',
  //     createdBy :{
  //       id:'1',
  //       firstName: 'Pradeep',
  //       profilePic:'./../../assets/images/avatars/thumb-8.jpg',
  //     },
  //     createdAt : new Date(),
  //     comment:'Ant Design, a design language for background applications, is refined by Ant UED TeamAnt Design....',
  //     isPinned:false,
  //     attachments:null
  //   }
  // ];
  constructor(private _taskService: TaskService) { }

  ngOnInit() {
    this.getMessage();
  }

  async pinMessage(item:TaskComments){
    this.pinInProcess=true;
    try {
      await this._taskService.pinComment(item).toPromise();
      this.pinInProcess = false;
    } catch (e) {
      this.pinInProcess = false;
    }
  }

  async getMessage(){
    this.getCommentInProcess=true;
    try {
      this.data = await this._taskService.getComments(this.taskId).toPromise();
      this.getCommentInProcess = false;
    } catch (e) {
      this.getCommentInProcess = false;
    }
  }

}
