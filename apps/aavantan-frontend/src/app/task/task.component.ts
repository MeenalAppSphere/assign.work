import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  BaseResponseModel,
  Project,
  ProjectMembers,
  ProjectPriority,
  ProjectStages,
  Sprint,
  Task, TaskComments,
  TaskType,
  User
} from '@aavantan-app/models';
import { UserQuery } from '../queries/user/user.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { GeneralService } from '../shared/services/general.service';
import { TaskService } from '../shared/services/task/task.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskQuery } from '../queries/task/task.query';


@Component({
  selector: 'aavantan-app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, OnDestroy {

  public currentProject: Project = null;
  public currentUser: User;
  public listOfSelectedWatchers: any = [];
  public listOfSelectedTags: any = [];
  public assigneeTo: ProjectMembers;
  public selectedRelatedItem: Task;
  public selectedDependentItem: Task;
  public selectedTaskType: TaskType;
  public selectedPriority: ProjectPriority;
  public selectedStage: ProjectStages;
  public timelogModalIsVisible: boolean = false;
  public isOpenActivitySidebar: boolean = true;
  public createTaskInProcess: boolean = false;
  public createCommentInProcess: boolean = false;
  public getTaskInProcess:boolean = false;

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
  public commentForm: FormGroup;
  public assigneeDataSource: ProjectMembers[] = [];
  public relatedTaskDataSource: Task[] = [];
  public dependentTaskDataSource: Task[] = [];
  public sprintDataSource: Sprint[] = [
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
  public priorityDataSource: ProjectPriority[] = [];
  public displayName: string;
  public taskData:BaseResponseModel<Task>;
  public taskId : string;

  constructor(private  _activatedRouter: ActivatedRoute,
              protected notification: NzNotificationService,
              private FB: FormBuilder,
              private _taskService: TaskService,
              private _generalService: GeneralService,
              private _userQuery: UserQuery,
              private _taskQuery: TaskQuery) {
  }

  ngOnInit() {

    this.displayName = this._activatedRouter.snapshot.params.displayName;

    if(this.displayName && this.displayName.split('-').length>1){
      this.getTask();
    }

    this.taskForm = this.FB.group({
      projectId: [null],
      name: [null, [Validators.required]],
      taskType: [null, [Validators.required]],
      description: [null],
      assigneeId: [null],
      createdById: [null],
      sprint: [null],
      priority: [null],
      watchers: [null],
      dependentItem: [null],
      relatedItem: [null],
      tags: [null],
      epic: [null]
    });

    this._taskQuery.tasks$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.relatedTaskDataSource = res;
        this.dependentTaskDataSource = res;
      }else{
        this._taskService.getAllTask().subscribe();
      }
    });

    this.commentForm = this.FB.group({
      comment: [null, [Validators.required]]
    });

    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {

        this.currentProject = res;
        this.stagesDataSource = res.settings.stages;
        this.taskTypeDataSource = res.settings.taskTypes;
        this.assigneeDataSource = res.members;
        this.priorityDataSource = res.settings.priorities;

        if (this.taskTypeDataSource && this.displayName) {

          const arr: TaskType[] = this.taskTypeDataSource.filter((ele) => {
            return ele.displayName === this.displayName.split('-')[0];
          });

          if (arr && arr.length) {
            this.selectedTaskType = arr[0];
          }

        } else {
          this.selectedTaskType = this.taskTypeDataSource[0];
        }

      }
    });

    this._userQuery.user$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentUser = res;
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

  public selectDependentItemTypeahead(e: Task) {
    this.selectedDependentItem = e;
  }

  public selectRelatedItemTypeahead(e: Task) {
    this.selectedRelatedItem = e;
  }

  public cancelTaskForm() {
    this.taskForm.reset();
  }

  async getTask(){
    this.getTaskInProcess = true;
    try {

      this.taskData= await this._taskService.getTask(this.displayName).toPromise();
      this.taskForm.patchValue(this.taskData.data);
      this.taskId = this.taskData.data.id;

      this.selectTaskType(this.taskData.data.taskType as TaskType);
      this.selectPriority(this.taskData.data.priority as ProjectPriority);

      this.getTaskInProcess = false;
    } catch (e) {
      this.getTaskInProcess = false;
    }
  }


  async saveForm() {

    const task: Task = { ...this.taskForm.getRawValue() };
    task.projectId = this.currentProject.id;
    task.createdById = this._generalService.user.id;
    task.taskType = this.selectedTaskType.id;

    if (!task.name || !task.taskType) {
      this.notification.error('Error', 'Please check all mandatory fields');
      return;
    }

    this.createTaskInProcess = true;
    try {
      if(this.taskId){
        await this._taskService.updateTask(task).toPromise();
      }else{
        await this._taskService.createTask(task).toPromise();
        this.taskForm.reset();
      }

      this.createTaskInProcess = false;
    } catch (e) {
      this.createTaskInProcess = false;
    }

  }

  public resetCommentForm() {
    this.commentForm.reset();
  }

  public selectAssigneeTypeahead(user: ProjectMembers) {
    if (user) {
      this.assigneeTo = user;
      this.taskForm.get('assigneeId').patchValue(user.userId);
    }
  }

  public selectTaskType(item: TaskType) {
    this.selectedTaskType = item;
  }

  public selectPriority(item: ProjectPriority) {
    this.selectedPriority = item;
    this.taskForm.get('priority').patchValue(item.id);
  }

  public selectStage(item: ProjectStages) {
    this.selectedStage = item;
  }

  /* comment */
  async saveComment() {
    this.createCommentInProcess = true;

    const comment: TaskComments = { ...this.commentForm.getRawValue() };

    try {
      await this._taskService.addComment(this.taskId, comment).toPromise();
      this.commentForm.reset();
      this.createCommentInProcess = false;
    } catch (e) {
      this.createCommentInProcess = false;
    }
  }


  public ngOnDestroy() {

  }

}
