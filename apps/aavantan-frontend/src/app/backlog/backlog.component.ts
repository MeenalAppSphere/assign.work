import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Task, DraftSprint } from '../shared/interfaces/task.interface';
import { Member } from '../shared/interfaces/member.interface';
import { User } from '@aavantan-app/models';

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
  public isDisabledCraeteBtn:boolean=true;
  public draftSprint: DraftSprint;
  public draftData:Task[]=[];
  public showStartWizard: boolean;
  public wizardIndex = 0;
  public wizardTitle = 'Title';
  public projectTeams: User[] = [];
  public dateFormat = 'mm/dd/yyyy';
  public sprintData:any;
  constructor() {}

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

    // dummy sprint wizard data
    this.sprintData={
      title:'Sprint 1'
    }
    this.projectTeams=[{
        id:'1',
        firstName: 'Pradeep',
        profilePic:'http://themenate.com/enlink/assets/images/avatars/thumb-4.jpg'
      },
      {
        id:'2',
        firstName: 'Vishal',
        profilePic:'http://themenate.com/enlink/assets/images/avatars/thumb-5.jpg'
      },
      {
        id:'3',
        firstName: 'Aashsih',
        profilePic:'http://themenate.com/enlink/assets/images/avatars/thumb-6.jpg'
      }]
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

  public startNewSprint(){
    this.showStartWizard=true;
  }

  public cancel(): void {
    this.showStartWizard=false;
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
    console.log('Done');
    this.showStartWizard=false;
    this.wizardIndex = 0;
    this.sprintData.id="1";
  }
  changeContent(): void {
    switch (this.wizardIndex) {
      case 0: {
        this.wizardTitle = 'Title';
        break;
      }
      case 1: {
        this.wizardTitle = 'Team';
        break;
      }
      case 2: {
        this.wizardTitle = 'Duration';
        break;
      }
      default: {
        this.wizardTitle = 'error';
      }
    }
  }
  public createSprint(){
    console.log('Create Sprint For Tasks ', this.draftSprint.ids);
  }

}
