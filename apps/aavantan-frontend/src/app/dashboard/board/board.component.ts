import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Sprint, SprintStatusEnum, Task } from '@aavantan-app/models';

@Component({
  selector: 'aavantan-app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {

  public tasks:any=[{"name":"TODO","position":0,"blockId":"21lwkj1231","tasks":[{"id":"5d76654c11992d0cffbc10e5","displayName":"BUG-111","blockId":"21lwkj1231","name":"Create Login api with google and Github","closed":false,"description":"Create a signup API","stageId":"5d76654af04b8710c4dafaa7","projectId":"5d76654a7c2bb5109e7280bf","position":1,"proirity":{"name":"Critical","color":"#F80647"},"comments":0,"taskType":{"name":"BUG","color":"#F80647"},"assigned":{"memberId":"59de14978d0fd81978d0fd81","fullName":"Pradeep Sharma","firstName":"Pradeep","lastName":"Sharma","initial":"PS","profilePic":"https://pbs.twimg.com/profile_images/1131596312825044993/ZJubr5eo_200x200.png"},"url":"https://trello.com/c/u1lc0kbq/1-signup-api","createdAt":"2019-09-09T14:50:55.104Z","updatedAt":"2019-09-09T14:50:55.104Z"},{"id":"5d76654c11992d0cffbc10e5","blockId":"21lwkj1231","displayName":"BUG-112","name":"Signup API","closed":false,"description":"Create a signup API","stageId":"5d76654af04b8710c4dafaa7","projectId":"5d76654a7c2bb5109e7280bf","position":1,"proirity":{"name":"Low","color":"green"},"comments":0,"taskType":{"name":"BUG","color":"#F80647"},"assigned":{"memberId":"59de14978d0fd81978d0fd81","fullName":"Pradeep Sharma","firstName":"Pradeep","lastName":"Sharma","initial":"PS","profilePic":"https://pbs.twimg.com/profile_images/1131596312825044993/ZJubr5eo_200x200.png"},"url":"https://trello.com/c/u1lc0kbq/1-signup-api","createdAt":"2019-09-09T14:50:55.104Z","updatedAt":"2019-09-09T14:50:55.104Z"}]},{"name":"In-Progress","position":1,"blockId":"21lwkj1232","tasks":[{"id":"5d76654c11992d0cffbc10e5","displayName":"CR-110","blockId":"21lwkj1232","name":"Signup API","closed":false,"description":"Create a signup API","stageId":"5d76654af04b8710c4dafaa7","projectId":"5d76654a7c2bb5109e7280bf","position":1,"proirity":{"name":"Medium","color":"#2196f3"},"comments":0,"taskType":{"name":"CR","color":"#F0CB2D"},"assigned":{"memberId":"59de14978d0fd81978d0fd81","fullName":"Pradeep Sharma","firstName":"Pradeep","lastName":"Sharma","initial":"PS","profilePic":"https://pbs.twimg.com/profile_images/1131596312825044993/ZJubr5eo_200x200.png"},"url":"https://trello.com/c/u1lc0kbq/1-signup-api","createdAt":"2019-09-09T14:50:55.104Z","updatedAt":"2019-09-09T14:50:55.104Z"}]},{"name":"Done","position":2,"blockId":"21lwkj1233","tasks":[{"id":"5d76654c11992d0cffbc10e5","displayName":"BUG-113","blockId":"21lwkj1233","name":"Signup API","closed":false,"description":"Create a signup API","stageId":"5d76654af04b8710c4dafaa7","projectId":"5d76654a7c2bb5109e7280bf","position":1,"proirity":{"name":"Medium","color":"#2196f3"},"comments":0,"taskType":{"name":"BUG","color":"#F80647"},"assigned":{"memberId":"59de14978d0fd81978d0fd81","fullName":"Pradeep Sharma","firstName":"Pradeep","lastName":"Sharma","initial":"PS","profilePic":"https://pbs.twimg.com/profile_images/1131596312825044993/ZJubr5eo_200x200.png"},"url":"https://trello.com/c/u1lc0kbq/1-signup-api","createdAt":"2019-09-09T14:50:55.104Z","updatedAt":"2019-09-09T14:50:55.104Z"}]}];
  public tasksData=true;
  public timelogModalIsVisible: boolean;
  @Output() toggleTimeLogShow: EventEmitter<any> = new EventEmitter<any>();
  public selectedTaskItem:Task;
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
  itemStringsTODO = [
    'Some quick example text to build on the card title and make up the bulk of the card\'s content',
    'Task 2',
    'Task 3',
    'Task 4',
    'Some quick example text to build on the card title and make up the bulk of the card\'s content',
    'Task 6',
    'Task 7',
    'Task 8'
  ];

  itemStringsPROGRESS = ['Task 1-1', 'Task 1-2'];

  itemStringsQA = ['Task 1-1', 'Task 1-2'];

  itemStringsDONE = ['Task 1-1', 'Task 1-2'];

  constructor() { }

  ngOnInit() {
  }

  public timeLog(item:Task) {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
    this.selectedTaskItem=item;
  }

}
