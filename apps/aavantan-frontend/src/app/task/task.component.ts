import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  AddCommentModel,
  BaseResponseModel, GetTaskByIdOrDisplayNameModel,
  Project,
  ProjectMembers,
  ProjectPriority,
  ProjectStages, ProjectStatus,
  Sprint,
  Task, TaskComments, TaskHistory, CommentPinModel,
  TaskType,
  User, GetTaskHistoryModel, BasePaginatedResponse, GetAllTaskRequestModel
} from '@aavantan-app/models';
import { UserQuery } from '../queries/user/user.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { GeneralService } from '../shared/services/general.service';
import { TaskService } from '../shared/services/task/task.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { TaskQuery } from '../queries/task/task.query';
import { TaskUrls } from '../shared/services/task/task.url';
import { Observable, Subject } from 'rxjs';
import { UserService } from '../shared/services/user/user.service';
import { debounceTime } from 'rxjs/operators';
import { ProjectService } from '../shared/services/project/project.service';

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
  public listOfSelectedRelatedItems: string[] = [];
  public selectedAssignee: User = {};
  public selectedRelatedItem: Task;
  public selectedDependentItem: Task;
  public selectedTaskType: TaskType;
  public selectedPriority: ProjectPriority;
  public selectedStage: ProjectStages;
  public selectedStatus: ProjectStatus;
  public timelogModalIsVisible: boolean = false;
  public epicModalIsVisible: boolean = false;
  public isOpenActivitySidebar: boolean = true;
  public createTaskInProcess: boolean = false;
  public createCommentInProcess: boolean = false;
  public getTaskInProcess: boolean = false;
  public getCommentInProcess: boolean = false;
  public getHistoryInProcess: boolean = false;
  public currentTask : Task;

  public fileList2 = [];

  public taskForm: FormGroup;
  public commentForm: FormGroup;
  public assigneeDataSource: User[] = [];
  public relatedTaskDataSource: Task[] = [];
  public dependentTaskDataSource: Task[] = [];
  public commentsRes: BaseResponseModel<TaskComments[]>;
  public commentsList: TaskComments[] = [];
  public historyRes: BaseResponseModel<BasePaginatedResponse<TaskHistory>>;
  public historyList: TaskHistory[] = [];
  public pinnedCommentsList: TaskComments[] = [];
  public sprintDataSource: Sprint[] = [];
  public tagsDataSource: string[];

  public epicDataSource = [];

  public taskTypeDataSource: TaskType[] = [];
  public stagesDataSource: ProjectStages[] = [];
  public statusDataSource: ProjectStatus[] = [];
  public priorityDataSource: ProjectPriority[] = [];
  public displayName: string;
  public taskData: BaseResponseModel<Task>;
  public taskId: string;
  public attachementHeader: any;
  public attachementUrl: string;
  public attachementIds: string[] = [];

  public isSearching: boolean;
  public isSearchingWatchers: boolean;

  public isSearchingTags: boolean;

  public modelChanged = new Subject<string>();
  public modelChangedWatchers = new Subject<string>();

  public nzFilterOption = () => true;




  constructor(private  _activatedRouter: ActivatedRoute,
              protected notification: NzNotificationService,
              private FB: FormBuilder,
              private _taskService: TaskService,
              private _generalService: GeneralService,
              private _userQuery: UserQuery,
              private _taskQuery: TaskQuery,
              private _userService: UserService,
              private _projectService: ProjectService) {
    this.notification.config({
      nzPlacement: 'bottomRight'
    });
  }

  ngOnInit() {

    this.attachementUrl = TaskUrls.attachement;

    this.attachementHeader = {
      Authorization: 'Bearer ' + this._generalService.token
    };

    this.displayName = this._activatedRouter.snapshot.params.displayName;

    if (this.displayName && this.displayName.split('-').length > 1) {
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
      dependentItemId: [null],
      relatedItemId: [null],
      tags: [null],
      epic: [null],
      status: [null],
      estimateTime: [null]
    });

    this._taskQuery.tasks$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.relatedTaskDataSource = res;
        this.dependentTaskDataSource = res;
      } else {
        const json: GetAllTaskRequestModel = {
          projectId: this._generalService.currentProject.id,
          sort: 'createdAt',
          sortBy: 'desc'
        };
        this._taskService.getAllTask(json).subscribe();
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
        this.statusDataSource = res.settings.status;

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


    // search assignee
    this.modelChanged
      .pipe(
        debounceTime(300))
      .subscribe(() => {
        const queryText = this.taskForm.get('assigneeId').value;
        const name = this.selectedAssignee.firstName + ' ' + this.selectedAssignee.lastName;
        if (!queryText || this.taskForm.get('assigneeId').value === name) {
          return;
        }
        this.isSearching = true;
        this._userService.searchUser(queryText).subscribe((data) => {
          this.isSearching = false;
          this.assigneeDataSource = data.data;
        });

      });
    // end search assignee

    // search watchers
    this.modelChangedWatchers
      .pipe(
        debounceTime(300))
      .subscribe(() => {
        const queryText = this.taskForm.get('assigneeId').value;
        if (!queryText) {
          return;
        }
        this.isSearchingWatchers = true;
        this._userService.searchUser(queryText).subscribe((data) => {
          this.isSearchingWatchers = false;
          this.assigneeDataSource = data.data;
        });

      });
    // end search watchers

  }

  public searchWatchers(value: string): void {
    this.isSearchingWatchers = true;
    this._userService.searchUser(value).subscribe((data) => {
      this.isSearchingWatchers = false;
      this.assigneeDataSource = data.data;
    });
  }

  public searchTags(value: string): void {
    this.isSearchingTags = true;
    this._projectService.searchTags(value).subscribe((data) => {
      this.isSearchingTags = false;
      this.tagsDataSource = data.data;
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
    const user: ProjectMembers = {
      userId: this._generalService.user.id,
      emailId: this._generalService.user.emailId,
      userDetails: this._generalService.user
    };
    this.selectedAssignee.id = this._generalService.user.id;
    this.selectedAssignee.firstName = this._generalService.user.firstName;
    this.selectedAssignee.lastName = this._generalService.user.lastName ? this._generalService.user.lastName : null;

    let userName = this._generalService.user.firstName ? this._generalService.user.firstName : this._generalService.user.emailId;
    if (this._generalService.user.firstName && this._generalService.user.lastName) {
      userName = userName + ' ' + this._generalService.user.lastName;
    }
    this.taskForm.get('assigneeId').patchValue(userName);
  }

  public toggleNewEpicModal() {
    this.epicModalIsVisible = !this.epicModalIsVisible;
  }

  public openTimeLogModal() {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
  }

  public cancelTaskForm() {
    this.taskId = null;
    this.taskForm.reset();
    this.selectedStatus = null;
    this.selectedPriority = null;
    this.attachementIds = [];
  }

  public updateCommentSuccess() {
    this.getMessage(true);
  }

  public timeLog() {
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
  }

  async getTask() {
    this.getTaskInProcess = true;
    try {
      const json: GetTaskByIdOrDisplayNameModel = {
        projectId: this._generalService.currentProject.id,
        displayName: this.displayName,
        taskId: this.taskId
      };
      this.taskData = await this._taskService.getTask(json).toPromise();
      this.currentTask = this.taskData.data;

      this.taskForm.patchValue(this.taskData.data);
      this.taskId = this.taskData.data.id;
      this.getMessage();
      this.getHistory();
      this.selectTaskType(this.taskData.data.taskType as TaskType);
      this.selectStatus(this.taskData.data.status as ProjectStatus);
      this.selectPriority(this.taskData.data.priority as ProjectPriority);
      this.selectDependentItemTypeahead(this.taskData.data.dependentItem as Task);
      if (this.taskData.data.assignee && this.taskData.data.assigneeId) {
        this.taskData.data.assignee.id = this.taskData.data.assigneeId;
        this.selectAssigneeTypeahead(this.taskData.data.assignee as User);
      }

      this.attachementIds = this.taskData.data.attachments;
      this.fileList2 = this.taskData.data.attachmentsDetails;

      this.getTaskInProcess = false;
    } catch (e) {
      this.getTaskInProcess = false;
    }
  }


  async getMessage(hideLoader?: boolean) {

    if (!hideLoader) {
      this.getCommentInProcess = true;
    }

    const json: CommentPinModel = {
      projectId: this._generalService.currentProject.id,
      taskId: this.taskId
    };

    try {

      this.commentsRes = await this._taskService.getComments(json).toPromise();
      this.commentsList = this.commentsRes.data;
      this.pinnedCommentsList = this.commentsRes.data.filter((ele) => {
        return ele.isPinned === true;
      });
      this.getCommentInProcess = false;

    } catch (e) {
      this.getCommentInProcess = false;
    }
  }

  async getHistory(hideLoader?: boolean) {
    if (!hideLoader) {
      this.getHistoryInProcess = true;
    }

    const json: GetTaskHistoryModel = {
      projectId: this._generalService.currentProject.id,
      taskId: this.taskId
    };

    try {
      this.historyRes = await this._taskService.getHistory(json).toPromise();
      this.historyList = this.historyRes.data.items;
      this.getHistoryInProcess = false;
    } catch (e) {
      this.getHistoryInProcess = false;
    }
  }

  handleChange({ file, fileList }): void {
    const status = file.status;
    if (status !== 'uploading') {
      console.log(file, fileList);
    }
    if (status === 'done') {

      if (file.response && file.response.data.id) {
        this.attachementIds.push(file.response.data.id);
      }

      this.notification.success('Success', `${file.name} file uploaded successfully.`);
    } else if (status === 'error') {
      this.notification.error('Error', `${file.name} file upload failed.`);
    }
  }

  handleRemove = (file: any) => new Observable<boolean>((obs) => {
    // console.log(file);


    //this._taskService.removeAttachment(file.id).subscribe();

    this.attachementIds.splice(this.attachementIds.indexOf(file.id), 1);
    this.fileList2 = this.fileList2.filter((ele) => {
      if (ele.id !== file.id) {
        return ele;
      }
    });


    // console.log('this.handleRemove instanceof Observable', this.handleRemove instanceof Observable)
    // console.log(obs)
    obs.next(false);
  });

  async saveForm() {
    const task: Task = { ...this.taskForm.getRawValue() };
    task.projectId = this.currentProject.id;
    task.createdById = this._generalService.user.id;

    task.taskType = this.selectedTaskType && this.selectedTaskType.id ? this.selectedTaskType.id : null;
    task.assigneeId = this.selectedAssignee && this.selectedAssignee.id ? this.selectedAssignee.id : null;
    task.status = this.selectedStatus && this.selectedStatus.id ? this.selectedStatus.id : null;
    task.priority = this.selectedPriority && this.selectedPriority.id ? this.selectedPriority.id : null;
    task.dependentItemId = this.selectedDependentItem && this.selectedDependentItem.id ? this.selectedDependentItem.id : null;
    task.relatedItemId = this.listOfSelectedRelatedItems;
    task.attachments = this.attachementIds;

    if (!task.name || !task.taskType) {
      this.notification.error('Error', 'Please check all mandatory fields');
      return;
    }

    this.createTaskInProcess = true;
    try {

      if (this.taskId) {
        task.id = this.taskId;
        task.displayName = this.displayName;
        await this._taskService.updateTask(task).toPromise();
      } else {
        await this._taskService.createTask(task).toPromise();
        this.taskForm.reset({ tags: [] });
        this.selectedStatus = null;
        this.selectedPriority = null;
        this.attachementIds = [];
      }

      this.createTaskInProcess = false;
    } catch (e) {
      this.createTaskInProcess = false;
    }

  }

  public resetCommentForm() {
    this.commentForm.reset();
  }

  public selectAssigneeTypeahead(user: User) {
    if (user && user.emailId) {
      this.selectedAssignee = user;
      let userName = user && user.firstName ? user.firstName : user.emailId;
      if (user && user.firstName && user && user.lastName) {
        userName = userName + ' ' + user.lastName;
      }
      this.taskForm.get('assigneeId').patchValue(userName);
    }
    this.modelChanged.next();
  }

  public selectTaskType(item: TaskType) {
    this.selectedTaskType = item;
  }

  public selectPriority(item: ProjectPriority) {
    this.selectedPriority = item;
  }

  public selectStage(item: ProjectStages) {
    this.selectedStage = item;
  }

  public addNewTag(event) {
    if (event.key === 'Enter' && event.target.value) {
      this.listOfSelectedTags = this.taskForm.get('tags').value;
      this.listOfSelectedTags.push(event.target.value);
      this.taskForm.get('tags').patchValue(this.listOfSelectedTags);
      this.tagsDataSource.push(event.target.value);
      event.target.value = null;
    }
  }

  public selectStatus(item: ProjectStatus) {
    this.selectedStatus = item;
  }

  public selectDependentItemTypeahead(task: Task) {
    if (task && task.name) {
      this.selectedDependentItem = task;
      this.taskForm.get('dependentItemId').patchValue(task.name);
    }
  }

  public selectRelatedItemTypeahead(task: Task) {
    // this.selectedRelatedItem = task;
  }


  /* comment */
  async saveComment() {
    this.createCommentInProcess = true;

    const comment: AddCommentModel = {
      comment: this.commentForm.getRawValue(),
      projectId: this._generalService.currentProject.id,
      taskId: this.taskId
    };

    try {
      await this._taskService.addComment(comment).toPromise();
      this.commentForm.reset();
      this.getMessage(true);
      this.createCommentInProcess = false;
    } catch (e) {
      this.createCommentInProcess = false;
    }
  }


  public ngOnDestroy() {

  }

}
