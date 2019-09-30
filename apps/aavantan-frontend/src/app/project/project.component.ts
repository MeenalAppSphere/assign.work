import { Component, OnInit } from '@angular/core';
import { Task } from '../shared/interfaces/task.interface';
import { Member } from '../shared/interfaces/member.interface';

@Component({
    templateUrl: './project.component.html'
})

export class ProjectComponent implements OnInit{
  public myTaskList: Task[]=[];
  public allTaskList: Task[]=[];
  public taskObj: Task;
  public memberObj: Member[]=[];
  public view: String = 'listView';
  public issueTypes:any[]=[
    {label: "BUG"},
    {label: "TASK"},
  ]
  constructor( ) {}

  ngOnInit(): void {
      for(let i=0; i<5; i++){
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
          name : 'A responsive table that stacks into cards when space is ' + i + '.',
          progress : (i * 10),
          createdAt : new Date(),
          description:'task description here, A responsive table that stacks into cardstask description here, A responsive table that stacks into cards',
          status:'In Progress',
          assigned:this.memberObj,
          estimate: 2+'hr',
          priority:'high'
        }
        this.myTaskList.push(this.taskObj);
      }
  }


  public  createTask(){

    }
}
