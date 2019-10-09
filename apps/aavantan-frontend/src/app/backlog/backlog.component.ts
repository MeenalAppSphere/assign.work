import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Task, DraftSprint } from '../shared/interfaces/task.interface';
import { Member } from '../shared/interfaces/member.interface';

@Component({
  selector: 'aavantan-app-backlog',
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss']
})
export class BacklogComponent implements OnInit {
  public allTaskList: Task[]=[];
  public draftTaskList: Task[]=[];
  public taskObj: Task;
  public memberObj: Member[]=[];
  public view: String = 'listView';
  public totalDuration: Number = 0;
  public isDisabledCraeteBtn:Boolean=true;
  public draftSprint: DraftSprint;
  public draftData:Task[]=[];
  constructor(private cdr:ChangeDetectorRef) {}

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

  public getTasksSelectedForSprint(ev:DraftSprint){
    this.draftSprint=ev;
    if(this.draftSprint && this.draftSprint.tasks.length>0){
      this.isDisabledCraeteBtn=false;
      this.prepareDraftSprint();
    }else{
      this.isDisabledCraeteBtn=true;
    }
  }

  public prepareDraftSprint(){
      this.draftData=this.draftSprint.tasks.filter((item)=>{
        return item;
      })
  }

  public createSprint(){
    console.log('Create Sprint For Tasks ', this.draftSprint.ids);
  }

}
