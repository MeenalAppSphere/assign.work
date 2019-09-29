import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'aavantan-app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {

  public assigneeValue:string;
  public taskTypeValue:string;
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
      firstName: 'Pradeep'
    },
    {
      _id: 2,
      firstName: 'Aashish'
    }
  ];
  public taskTypeDataSource = [
    {
      _id: 1,
      taskTypeName: 'BUG',
      value: 'bug'
    },
    {
      _id: 2,
      taskTypeName: 'CR',
      value: 'cr'
    },
    {
      _id: 3,
      taskTypeName: 'NEW WORK',
      value: 'newwork'
    },
    {
      _id: 4,
      taskTypeName: 'ENHANCEMENTS',
      value: 'enhancement'
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
      assignedTo: [null]
    });
  }

  public assignedToMe() {
    // this.taskForm.get('assignedTo').patchValue(this.userDetails.fullName);
    // this.taskForm.value.assignedTo = this.userDetails._id;
  }

  public openTimeLogModal(){

  }

  public selectTaskTypeTypeahead(e:string) {
    console.log('taskType',e);
  }
  public selectAssigneeTypeahead(e: string) {
    this.taskForm.get('assignedTo').patchValue(e);
    console.log('assignedTo',e);
  }
  public cancel(){
    this.taskForm.reset();
  }
  public saveForm() {
    console.log('Save', this.taskForm.value);
  }
}