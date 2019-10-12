import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Task } from '../shared/interfaces/task.interface';

@Component({
  selector: 'aavantan-app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {
  public listOfSelectedWatchers:any = [];
  public listOfSelectedTags:any = [];
  public assigneeTo:string;
  public taskTypeValue:string;
  public timelogModalIsVisible:Boolean=false;
  public isOpenActivitySidebar:Boolean = true;
  public defaultFileList = [
    {
      uid: -1,
      name: 'abc.png',
      status: 'done',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
      thumbUrl: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
    },
    {
      uid: -2,
      name: 'yyy.png',
      status: 'done',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
      thumbUrl: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
    }
  ];

  public fileList2 = [...this.defaultFileList];

  public taskForm: FormGroup;
  public assigneeDataSource = [
    {
      _id: 1,
      firstName: 'Assign to Me'
    },
    {
      _id: 2,
      firstName: 'Pradeep'
    },
    {
      _id: 3,
      firstName: 'Aashish'
    }
  ];
  public relatedTaskDataSource:Task[] = [
    {
      _id: '1',
      name: 'Related Task 1',
      taskType:'cr'
    },
    {
      _id: '2',
      name: 'Related Task 2',
      taskType:'enhancement'
    },
    {
      _id: '3',
      name: 'Related Task 3',
      taskType:'bug'
    }
  ];
  public dependentTaskDataSource:Task[] = [
    {
      _id: '1',
      name: 'Dependent Task 1',
      taskType:'cr'
    },
    {
      _id: '2',
      name: 'Dependent Task 2',
      taskType:'bug'
    },
    {
      _id: '3',
      name: 'Dependent Task 3',
      taskType:'cr'
    },
    {
      _id: '4',
      name: 'Dependent Task 4',
      taskType:'newwork'
    }
  ];
  public sprintDataSource = [
    {
      _id: 1,
      name: 'Sprint 1'
    },
    {
      _id: 2,
      name: 'Sprint 2'
    },
    {
      _id: 3,
      name: 'Sprint 3'
    }
  ];
  public tagsDataSource = [
    {
      _id: 1,
      name: 'Tag 1'
    },
    {
      _id: 2,
      name: 'Tag 2'
    },
    {
      _id: 3,
      name: 'Tag 3'
    }
  ];
  public epicDataSource = [
    {
      _id: 1,
      name: 'Epic 1'
    },
    {
      _id: 2,
      name: 'Epic 2'
    },
    {
      _id: 3,
      name: 'Epic 3'
    }
  ];
  public taskTypeDataSource = [
    {
      _id: 1,
      name: 'BUG',
      value: 'bug'
    },
    {
      _id: 2,
      name: 'CR',
      value: 'cr'
    },
    {
      _id: 3,
      name: 'NEW WORK',
      value: 'newwork'
    },
    {
      _id: 4,
      name: 'ENHANCEMENTS',
      value: 'enhancement'
    },
    {
      _id: 5,
      name: 'EPIC',
      value: 'epic'
    }
  ];
  public statusDataSource = [
    {
      _id: 1,
      name: 'TODO',
      value: 'todo'
    },
    {
      _id: 2,
      name: 'In-Progress',
      value: 'inprogress'
    },
    {
      _id: 3,
      name: 'QA',
      value: 'qa'
    },
    {
      _id: 4,
      name: 'Done',
      value: 'done'
    }
  ];

  constructor(
    private FB: FormBuilder
  ) {}

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
  }

  public toggleActivitySidebar(el:HTMLElement){
    this.isOpenActivitySidebar=!this.isOpenActivitySidebar;
    if(this.isOpenActivitySidebar && window.innerWidth<768){
      setTimeout(()=>{
        el.scrollIntoView();
      },200);
    }
  }
  public assignedToMe() {
    // this.taskForm.get('assignedTo').patchValue(this.userDetails.fullName);
    // this.taskForm.value.assignedTo = this.userDetails._id;
  }

  public openTimeLogModal(){
    this.timelogModalIsVisible=!this.timelogModalIsVisible;
  }

  public selectTaskTypeTypeahead(e:string) {
    console.log('taskType', e);
  }
  public selectAssigneeTypeahead(e: string) {
    this.taskForm.get('assignedTo').patchValue(e);
    console.log('assignedTo', e);
  }
  public cancel(){
    this.taskForm.reset();
  }
  public saveForm() {
    console.log('Save', this.taskForm.value);
  }
}
