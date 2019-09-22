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
  constructor( ) {}

  ngOnInit(): void {
      for(let i=0; i<5; i++){
        this.memberObj = [
          {
            _id:'1212'+(i+1),
            emailId:'abc'+(i+1)+'@gmail.com',
            firstName: 'Pradeep',
            profilePic: '../../assets/images/avatars/thumb-8.jpg'
          }
        ];
        this.taskObj= {
          _id : '100' + i,
          name : 'This is task' + i + '.',
          progress : (i * 10),
          createdAt : new Date(),
          description:'description here',
          status:'In Progress',
          assigned:this.memberObj
        }
        this.myTaskList.push(this.taskObj);
      }
  }


  public  createTask(){

    }
}
