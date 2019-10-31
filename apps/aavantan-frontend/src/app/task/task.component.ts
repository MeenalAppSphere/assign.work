import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Project, ProjectPriority, ProjectStages, Sprint, Task, TaskType, User } from '@aavantan-app/models';
import { UserQuery } from '../queries/user/user.query';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
  selector: 'aavantan-app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, OnDestroy {

  public enableTaskForm:boolean;
  public currentProject: Project = null;
  public listOfSelectedWatchers: any = [];
  public listOfSelectedTags: any = [];
  public assigneeTo: User;
  public selectedRelatedItem:Task;
  public selectedDependentItem:Task;
  public selectedTaskType: TaskType;
  public selectedPriority: ProjectPriority;
  public selectedStage: ProjectStages;
  public timelogModalIsVisible: boolean = false;
  public isOpenActivitySidebar: boolean = true;
  public defaultFileList = [
    {
      uid: -1,
      name: 'abc.png',
      status: 'done',
      url:
        'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
      thumbUrl:
        'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
    },
    {
      uid: -2,
      name: 'yyy.png',
      status: 'done',
      url:
        'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
      thumbUrl:
        'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
    }
  ];

  public fileList2 = [...this.defaultFileList];

  public taskForm: FormGroup;
  public assigneeDataSource :User[] = [
    {
      id: '1',
      firstName: 'Assign to Me',
      profilePic:'./../../assets/images/avatars/thumb-2.jpg'
    },
    {
      id: '2',
      firstName: 'Pradeep',
      profilePic:null
    },
    {
      id: '3',
      firstName: 'Aashish',
      profilePic:null
    }
  ];
  public relatedTaskDataSource: Task[] = [
    {
      id: '1',
      displayName:'BUG-1001',
      name: 'Related Task 1',
      taskType: {
        name:'BUG',
        color:'#ddee00'
      },
      createdBy:'',
      project: ''
    },
    {
      id: '2',
      displayName:'BUG-1002',
      name: 'Related Task 2',
      taskType: {
        name:'BUG',
        color:'#ddee00'
      },
      createdBy:'',
      project: ''
    },
    {
      id: '3',
      displayName:'CR-1001',
      name: 'Related Task 3',
      taskType: {
        name:'CR',
        color:'#ddee00'
      },
      createdBy:'',
      project: ''
    }
  ];
  public dependentTaskDataSource: Task[] = [
    {
      id: '1',
      displayName:'BUG-1001',
      name: 'Related Task 1',
      taskType: {
        name:'BUG',
        color:'#ddee00'
      },
      createdBy:'',
      project: ''
    },
    {
      id: '2',
      displayName:'BUG-1002',
      name: 'Related Task 2',
      taskType: {
        name:'BUG',
        color:'#ddee00'
      },
      createdBy:'',
      project: ''
    },
    {
      id: '3',
      displayName:'CR-1001',
      name: 'Related Task 3',
      taskType: {
        name:'CR',
        color:'#ddee00'
      },
      createdBy:'',
      project: ''
    }
  ];
  public sprintDataSource:Sprint[] = [
    {
      id: '1',
      name: 'Sprint 1'
    },
    {
      id: '2',
      name: 'Sprint 2'
    },
    {
      id: '3',
      name: 'Sprint 3'
    }
  ];
  public tagsDataSource = [
    {
      id: 1,
      name: 'Tag 1'
    },
    {
      id: 2,
      name: 'Tag 2'
    },
    {
      id: 3,
      name: 'Tag 3'
    }
  ];
  public epicDataSource = [
    {
      id: 1,
      name: 'Epic 1'
    },
    {
      id: 2,
      name: 'Epic 2'
    },
    {
      id: 3,
      name: 'Epic 3'
    }
  ];

  public taskTypeDataSource: TaskType[] = [];
  public stagesDataSource: ProjectStages[] = [];

  public priorityDataSource: ProjectPriority[] = [
    {
      id: '1',
      name: 'Low',
      color: 'green'
    }
    ,{
      id: '2',
      name: 'High',
      color: 'pink',
    },
    {
      id: '3',
      name: 'Medium',
      color: 'orange'
    },
    {
      id: '4',
      name: 'Critical',
      color: 'red'
    }
  ];

  constructor(private FB: FormBuilder, private _userQuery: UserQuery) {}

  ngOnInit() {
    this.taskForm = this.FB.group({
      title: [null, [Validators.required]],
      description: [null],
      taskType: [null, [Validators.required]],
      assignedTo: [null],
      sprint: [null],
      watchers: [null],
      dependentItem: [null],
      relatedItem: [null],
      tags: [null],
      epic: [null]
    });

    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentProject = res;
        this.stagesDataSource = res.settings.stages;
        this.taskTypeDataSource = res.settings.taskTypes;
        this.selectedTaskType = this.taskTypeDataSource[0];
        // this.assigneeDataSource = res.members;
        // this.priorityDataSource = res.settings.priorities;
        if(this.stagesDataSource.length && this.taskTypeDataSource.length) {
          this.enableTaskForm = false;
        }
      }
    });
  }

  public toggleActivitySidebar(el: HTMLElement) {
    this.isOpenActivitySidebar = !this.isOpenActivitySidebar;
    if (this.isOpenActivitySidebar && window.innerWidth < 768) {
      setTimeout(() => {
        el.scrollIntoView();
      }, 200);
    }
  }
  public assignedToMe() {
    // this.taskForm.get('assignedTo').patchValue(this.userDetails.fullName);
    // this.taskForm.value.assignedTo = this.userDetails.id;
  }

  public openTimeLogModal() {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
  }

  public selectAssigneeTypeahead(e: User) {
    this.assigneeTo=e;
    // this.taskForm.get('assignedTo').patchValue(e.id);
  }
  public selectDependentItemTypeahead(e: Task) {
    this.selectedDependentItem=e;
  }
  public selectRelatedItemTypeahead(e: Task) {
    this.selectedRelatedItem=e;
  }
  public cancel() {
    this.taskForm.reset();
  }
  public saveForm() {
    console.log('Save', this.taskForm.value);
  }

  public selectTaskType(item:TaskType){
    this.selectedTaskType=item;
  }
  public selectPriority(item:ProjectPriority){
    this.selectedPriority =item;
  }
  public selectStage(item:ProjectStages){
    this.selectedStage =item;
  }
  public ngOnDestroy(){

  }

}
