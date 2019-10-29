import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Sprint, Task, TaskType, User } from '@aavantan-app/models';

@Component({
  selector: 'aavantan-app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {

  public listOfSelectedWatchers: any = [];
  public listOfSelectedTags: any = [];
  public assigneeTo: User;
  public selectedRelatedItem:Task;
  public selectedDependentItem:Task;
  public selectedTaskType: TaskType;
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
      }
    },
    {
      id: '2',
      displayName:'BUG-1002',
      name: 'Related Task 2',
      taskType: {
        name:'BUG',
        color:'#ddee00'
      }
    },
    {
      id: '3',
      displayName:'CR-1001',
      name: 'Related Task 3',
      taskType: {
        name:'CR',
        color:'#ddee00'
      }
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
      }
    },
    {
      id: '2',
      displayName:'BUG-1002',
      name: 'Related Task 2',
      taskType: {
        name:'BUG',
        color:'#ddee00'
      }
    },
    {
      id: '3',
      displayName:'CR-1001',
      name: 'Related Task 3',
      taskType: {
        name:'CR',
        color:'#ddee00'
      }
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
  public taskTypeDataSource: TaskType[] = [
    {
      id: '1',
      name: 'BUG',
      color: '#F80647'
    },
    {
      id: '2',
      name: 'CR',
      color: '#F0CB2D'
    },
    {
      id: '3',
      name: 'NEW WORK',
      color: '#0E7FE0'
    },
    {
      id: '4',
      name: 'ENHANCEMENTS',
      color: '#0AC93E'
    },
    {
      id: '4',
      name: 'EPIC',
      color: '#1022A8'
    }
  ];

  public stagesDataSource = [
    {
      id: 1,
      name: 'TODO',
      value: 'todo'
    },
    {
      id: 2,
      name: 'In-Progress',
      value: 'inprogress'
    },
    {
      id: 3,
      name: 'QA',
      value: 'qa'
    },
    {
      id: 4,
      name: 'Done',
      value: 'done'
    }
  ];
  public priorityDataSource = [
    {
      id: '1',
      name: 'Low'
    }
    ,{
      id: '2',
      name: 'High'
    },
    {
      id: '3',
      name: 'Medium'
    },
    {
      id: '4',
      name: 'Critical'
    }
  ];

  constructor(private FB: FormBuilder) {}

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

    this.selectedTaskType=this.taskTypeDataSource[0];
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

  public selectTaskTypeTypeahead(e: string) {
    console.log('taskType', e);
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
}
