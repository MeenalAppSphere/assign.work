import { Component, OnInit } from '@angular/core';
import { User, Task, TaskType } from '@aavantan-app/models';

@Component({
    templateUrl: './project.component.html',
    styleUrls:['./project.component.scss']
})

export class ProjectComponent implements OnInit{
  public myTaskList: Task[]=[];
  public allTaskList: Task[]=[];
  public taskObj: Task;
  public memberObj: User[]=[];
  public view: String = 'listView';
  public taskTypeDataSource: TaskType[] = [
    {
      id: '1',
      name: 'BUG',
      value: 'bug',
      color: '#F80647'
    },
    {
      id: '2',
      name: 'CR',
      value: 'cr',
      color: '#F0CB2D'
    },
    {
      id: '3',
      name: 'NEW WORK',
      value: 'newwork',
      color: '#0E7FE0'
    },
    {
      id: '4',
      name: 'ENHANCEMENTS',
      value: 'enhancement',
      color: '#0AC93E'
    },
    {
      id: '4',
      name: 'EPIC',
      value: 'epic',
      color: '#1022A8'
    }
  ];
  constructor( ) {}

  ngOnInit(): void {
      for(let i=0; i<5; i++){
        this.memberObj = [
          {
            id:'1212'+(i+1),
            emailId:'abc'+(i+1)+'@gmail.com',
            firstName: 'Pradeep',
            profilePic: '../../assets/images/avatars/thumb-4.jpg'
          }
        ];
        this.taskObj= {
          id : '100' + i,
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
