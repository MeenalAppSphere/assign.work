import { Component, OnInit } from '@angular/core';
import { Task, TasksSelectedForSprint } from '../shared/interfaces/task.interface';
import { Member } from '../shared/interfaces/member.interface';

@Component({
  selector: 'aavantan-app-backlog',
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss']
})
export class BacklogComponent implements OnInit {
  public allTaskList: Task[]=[];
  public taskObj: Task;
  public memberObj: Member[]=[];
  public view: String = 'listView';
  public totalDuration: Number = 0;
  public isDisabledCraeteBtn:Boolean=true;
  public tasksSelectedForSprint: TasksSelectedForSprint;
  constructor() { }

  ngOnInit() {

    for(let i=0; i<50; i++){
      this.memberObj = [
        {
          _id:'1212'+(i+1),
          emailId:'abc'+(i+1)+'@gmail.com',
          firstName: 'Pradeep',
          profilePic: '../../assets/images/avatars/thumb-4.jpg'
        }
      ];
      this.taskObj= {
        _id : '100' + i,
        name : 'You can create sprint by selecting multiple tasks' + i + '.',
        progress : (i * 10),
        createdAt : new Date(),
        description:'task description here, A responsive table that stacks into cardstask description here, A responsive table that stacks into cards',
        status:'TO DO',
        assigned:this.memberObj,
        estimate: 2+'hr',
        priority:'low',
        selectedForSprint:false
      }
      this.allTaskList.push(this.taskObj);
    }
    if(this.allTaskList && this.allTaskList.length>0){
      this.countTotalDuration();
    }
  }

  public countTotalDuration(){
    this.allTaskList.forEach((ele)=>{
      const duration=ele.estimate.split('hr')[0];
      // @ts-ignore
      this.totalDuration += Number(duration);
    })
  }

  public getTasksSelectedForSprint(ev:TasksSelectedForSprint){
    this.tasksSelectedForSprint=ev;
    if(this.tasksSelectedForSprint && this.tasksSelectedForSprint.ids.length>0){
      this.isDisabledCraeteBtn=false;
    }else{
      this.isDisabledCraeteBtn=true;
    }
  }
  public createSprint(){
    console.log('Create Sprint For Tasks ', this.tasksSelectedForSprint.ids);
  }

}
