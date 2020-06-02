import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AddCommentModel, AddTaskToSprintModel,
  BasePaginatedResponse,
  BaseResponseModel,
  CommentPinModel,
  GetAllTaskRequestModel,
  GetTaskByIdOrDisplayNameModel,
  GetTaskHistoryModel,
  Mention,
  Project,
  ProjectMembers,
  ProjectPriority,
  ProjectStages, ProjectTags, RemoveTaskFromSprintModel,
  SearchProjectCollaborators,
  Sprint, SprintDurationsModel, SprintErrorEnum, SprintErrorResponse,
  Task,
  TaskComments,
  TaskHistory,
  TaskPriorityModel,
  TaskStatusModel,
  TaskTimeLogHistoryModel,
  TaskTimeLogHistoryResponseModel,
  TaskTimeLogResponse,
  TaskTypeModel,
  UpdateCommentModel,
  User
} from '@aavantan-app/models';
import { UserQuery } from '../queries/user/user.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute, NavigationEnd, Router, RouterEvent } from '@angular/router';
import { GeneralService } from '../shared/services/general.service';
import { TaskService } from '../shared/services/task/task.service';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { TaskQuery } from '../queries/task/task.query';
import { TaskUrls } from '../shared/services/task/task.url';
import { combineLatest, Observable, Subject } from 'rxjs';
import { UserService } from '../shared/services/user/user.service';
import { auditTime, debounceTime } from 'rxjs/operators';
import { ProjectService } from '../shared/services/project/project.service';
import 'quill-mention';
import { TaskStatusQuery } from '../queries/task-status/task-status.query';
import { TaskPriorityQuery } from '../queries/task-priority/task-priority.query';
import { TaskTypeQuery } from '../queries/task-type/task-type.query';
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { SprintService } from '../shared/services/sprint/sprint.service';

@Component({
  selector: 'aavantan-app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, OnDestroy {

  public isFolded: boolean;
  public showTaskNotFoundView: boolean;
  public currentProject: Project = null;
  public currentUser: User;
  public listOfSelectedWatchers: User[] = [];
  public listOfSelectedTags: ProjectTags[] = [];
  public listOfSelectedRelatedItems: string[] = [];
  public selectedAssignee: User = {};
  public selectedRelatedItem: Task;
  public selectedDependentItem: Task;
  public selectedTaskType: TaskTypeModel;
  public selectedPriority: ProjectPriority;
  public selectedStage: ProjectStages;
  public selectedStatus: TaskStatusModel;
  public timelogModalIsVisible: boolean = false;
  public epicModalIsVisible: boolean = false;
  public isOpenActivitySidebar: boolean = true;
  public createTaskInProcess: boolean = false;
  public updateSidebarContentInProcess: boolean = false;
  public createCommentInProcess: boolean = false;
  public getTaskInProcess: boolean = false;
  public getCommentInProcess: boolean = false;
  public getHistoryInProcess: boolean = false;
  public getTimeLogInProcess: boolean = false;
  public showCommentsList: boolean;
  public showPinnedCommentsList: boolean;
  public currentTask: Task;

  public uploadedImages = [];

  public taskForm: FormGroup;
  public taskFormSideBar: FormGroup;
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
  public tagsDataSource: ProjectTags[] = [];

  public epicDataSource = [];

  public taskTypeDataSource: TaskTypeModel[] = [];
  public stagesDataSource: ProjectStages[] = [];
  public statusDataSource: TaskStatusModel[] = [];
  public priorityDataSource: TaskPriorityModel[] = [];
  public displayName: string;
  public isUpdateMode: boolean;
  public taskData: Task;
  public taskId: string;
  public sprintData: Sprint;
  public attachementHeader: any;
  public attachementUrl: string;
  public attachementIds: string[] = [];

  public isSearching: boolean;
  public isSearchingWatchers: boolean;

  public isSearchingTags: boolean;

  public modelChanged = new Subject<string>();
  public modelChangedWatchers = new Subject<string>();
  public modelChangedTags = new Subject<string>();
  public tagsQueryText: string = null;
  public watchersQueryText: string = null;
  public progressData: TaskTimeLogResponse;
  public uploadingImage: boolean;

  public panels: any[] = [{
    active: false,
    name: 'Time log history',
    arrow: true
  }];
  public timelogHistoryList: TaskTimeLogHistoryResponseModel[] = [];

  /* Quill Editor */
  public atMentionUsers: Mention[] = [];
  public hashValues: Mention[] = [];
  public quillConfig = {};

  /* end Quill Editor */

  constructor(private  _activatedRouter: ActivatedRoute,
              protected notification: NzNotificationService,
              private FB: FormBuilder,
              private _taskService: TaskService,
              private _generalService: GeneralService,
              private _userQuery: UserQuery,
              private _taskQuery: TaskQuery,
              private _userService: UserService,
              private _projectService: ProjectService,
              private router: Router,
              private cdr: ChangeDetectorRef,
              private _taskStatusQuery: TaskStatusQuery, private _taskPriorityQuery: TaskPriorityQuery,
              private _taskTypeQuery: TaskTypeQuery,
              private themeService: ThemeConstantService,
              private _sprintService: SprintService,
              private modal: NzModalService) {

    this.notification.config({
      nzPlacement: 'bottomRight'
    });

    // if task page is visible and user clicked on Create Task button from side bar
    // router.events.subscribe((val) => {
    //   if ((val instanceof RouterEvent) && (val instanceof NavigationEnd)) {
    //     if (!val.url.includes('/dashboard/task/')) {
    //       return;
    //     }
    //     const splitedUrl = val.url.split('/dashboard/task/')[1];
    //     if (splitedUrl.indexOf('-') <= 0) {
    //       this.cancelTaskForm();
    //     }
    //   }
    // });
  }

  ngOnInit() {

    this.themeService.toggleFold(true);

    this.attachementUrl = TaskUrls.attachement;

    this.attachementHeader = {
      Authorization: 'Bearer ' + this._generalService.token
    };

    this.displayName = this._activatedRouter.snapshot.params.displayName;
    this.isUpdateMode = this.displayName.includes('-');

    this.sprintData = this._generalService.currentProject.sprint;

    this.taskForm = this.FB.group({
      projectId: [null],
      name: [null, [Validators.required]],
      taskTypeId: [null, [Validators.required]],
      description: [null],
      assigneeId: [null],
      createdById: [null],
      sprint: [null],
      priorityId: [null],
      dependentItemId: [null],
      relatedItemId: [null],
      statusId: [null],

      tags: [null],
      epic: [null],
      watchers: [null],
      estimatedTime: [null],
      remainingHours: [null],
      remainingMinutes: [null]
    });

    // for sidebar controls
    this.taskFormSideBar = this.FB.group({
      projectId: [null],
      watchers: [null],
      tags: [null],
      epic: [null],
      estimatedTime: [null],
      remainingHours: [null],
      remainingMinutes: [null]
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

    this._taskQuery.createNewTaskAction$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.resetTaskForm();
        this._taskService.resetStoreFlags();
      }
    });

    this.commentForm = this.FB.group({
      comment: [null, [Validators.required]],
      uuid: new FormControl(Date.now())
    });

    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {

        this.currentProject = res;
        this.stagesDataSource = res.settings.stages;
      }
    });


    this._userQuery.user$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentUser = res;
      }
    });

    // get all task type, priorities and status from store
    // then call get task
    combineLatest([this._taskTypeQuery.types$, this._taskPriorityQuery.priorities$, this._taskStatusQuery.statuses$])
      .pipe(auditTime(700))
      .subscribe(result => {
        // result[0]  is expecting task types
        // result[1]  is expecting priorities
        // result[2]  is expecting status

        if (result[0].length === 0 || result[1].length === 0 || result[2].length === 0) {
          return;
        }

        // taskType list
        this.taskTypeDataSource = result[0];
        // priority list
        this.priorityDataSource = result[1];
        // status list
        this.statusDataSource = result[2];

        //If task is in add mode
        if (!this.isUpdateMode) {

          const arr: TaskTypeModel[] = this.taskTypeDataSource.filter((ele) => {
            return ele.displayName === this.displayName.split('-')[0];
          });

          if (arr && arr.length) {
            this.selectedTaskType = arr[0];
            this.selectedAssignee = { ...arr[0].assignee };
            this.taskForm.get('assigneeId').patchValue(`${this.selectedAssignee.firstName} ${this.selectedAssignee.lastName}`);
            this.modelChanged.next();

            this.selectedPriority = this.priorityDataSource.find(priority => priority.id === this.currentProject.settings.defaultTaskPriorityId);
            this.selectedStatus = this.statusDataSource.find(status => status.id === this.currentProject.settings.defaultTaskStatusId);
          } else {
            this.notification.error('Error', 'The resource you are looking for does not exists');
          }
        }

        //If task is in update model
        // get task details from display name
        if (this.isUpdateMode) {
          this.getTask();
        }
      });


    // search assignee
    this.modelChanged
      .pipe(
        debounceTime(500))
      .subscribe(() => {
        const queryText = this.taskForm.get('assigneeId').value;
        const name = this.selectedAssignee.firstName + ' ' + this.selectedAssignee.lastName;
        if (!queryText || this.taskForm.get('assigneeId').value === name) {
          return;
        }
        this.isSearching = true;
        const json: SearchProjectCollaborators = {
          projectId: this._generalService.currentProject.id,
          query: queryText
        };
        this._userService.searchProjectCollaborator(json).subscribe((data) => {
          this.isSearching = false;
          this.assigneeDataSource = data.data;
        });

      });
    // end search assignee

    // search watchers
    this.modelChangedWatchers
      .pipe(
        debounceTime(500))
      .subscribe(() => {

        const queryText = this.taskFormSideBar.get('watchers').value;

        if (!queryText || (queryText && typeof (queryText) === 'object')) {
          return;
        }
        this.isSearchingWatchers = true;
        const json: SearchProjectCollaborators = {
          projectId: this._generalService.currentProject.id,
          query: queryText
        };
        try {
          this._userService.searchProjectCollaborator(json).subscribe((data) => {
            this.isSearchingWatchers = false;
            this.assigneeDataSource = data.data;
          });
        } catch (e) {
          this.isSearchingWatchers = false;
        }

      });
    // end search watchers

    // search tags
    this.modelChangedTags
      .pipe(
        debounceTime(500))
      .subscribe(() => {
        const queryText = this.taskFormSideBar.get('tags').value;
        if (!queryText || (queryText && typeof (queryText) === 'object')) {
          return;
        }
        this.isSearchingTags = true;
        try {
          this._projectService.searchTags(queryText).subscribe((data) => {
            this.isSearchingTags = false;
            this.tagsDataSource = data.data;
          });
        } catch (e) {
          this.isSearchingTags = false;
        }
      });
    // end search tags

    this.initQilllConfig();
  }

  public initQilllConfig() {

    if (this.currentProject.members.length > 0) {
      this.currentProject.members.forEach((ele) => {
        let name = ele.userDetails.firstName + ' ' + ele.userDetails.lastName;
        if (!ele.userDetails.firstName) {
          name = ele.userDetails.emailId;
        }
        this.atMentionUsers.push({
          id: ele.userId,
          value: name,
          link: ele.userDetails.profileLink ? ele.userDetails.profileLink : ''
        });
      });
    }


    this.quillConfig = {
      toolbar: {
        container: [
          ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
          ['code-block'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          [{ 'color': ['#333333', '#000000', 'red', 'green'] }],
          ['clean'],                                         // remove formatting button
          ['link', 'image', 'video']
        ]
      },
      mention: {
        allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
        mentionDenotationChars: ['@', '#'],
        source: (searchTerm, renderList, mentionChar) => {
          let values;

          if (mentionChar === '@') {
            values = this.atMentionUsers;
          } else {
            values = this.hashValues = this.atMentionUsers;
          }

          if (searchTerm.length === 0) {
            renderList(values, searchTerm);
          } else {
            const matches = [];
            for (let i = 0; i < values.length; i++)
              // tslint:disable-next-line:no-bitwise
              if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())) matches.push(values[i]);
            renderList(matches, searchTerm);
          }
        }
      },
      keyboard: {
        bindings: {
          shiftEnter: {
            key: 13,
            shiftKey: true, // Handle shift+enter
            handler: (range, context) => {

              console.log('shift+enter');
            }
          },
          enter: {
            key: 13, //Enter
            handler: (range, context) => {

              return true;
            }
          }
        }
      }
    };

  }

  onSelectionChanged = (event) => {
    if (event.oldRange == null) {
      this.onFocus();
    }
    if (event.range == null) {
      this.onBlur();
    }
  };

  onContentChanged = (event) => {
    //console.log(event.html);
  };

  onFocus = () => {
    console.log('On Focus');
  };
  onBlur = () => {
    console.log('Blurred');
  };

  //=========== end quill ============//

  public searchWatchers(user?: User) {
    if (user && user.emailId) {
      if (this.listOfSelectedWatchers.findIndex(item => item.emailId === user.emailId) < 0) {
        this.listOfSelectedWatchers.push(user);

        this.saveTaskSideBar(); // save api call

        this.taskFormSideBar.get('watchers').patchValue('');
      }
    }
    this.modelChangedWatchers.next();
  }

  public removeWatchers(mem: User) {
    this.listOfSelectedWatchers = this.listOfSelectedWatchers.filter(item => item !== mem);
    this.saveTaskSideBar(); // save api call
  }


  //===================//

  public searchTags(tag?: ProjectTags) {
    if (tag && tag.name) {
      // console.log(this.listOfSelectedTags.findIndex(item => item.name === tag.name));
      if (this.listOfSelectedTags.findIndex(item => item.name === tag.name) < 0) {
        this.listOfSelectedTags.push(tag);
        this.saveTaskSideBar(); // save api call
        this.taskFormSideBar.get('tags').patchValue('');
      }
    }
    this.modelChangedTags.next();
  }

  public removeTag(tag?: ProjectTags) {
    this.listOfSelectedTags = this.listOfSelectedTags.filter(item => item.name !== tag.name);
    this.saveTaskSideBar(); // save api call
  }

  public onKeydown(event) {
    if (event.key === 'Enter') {
      const tg = this.taskFormSideBar.get('tags').value;
      let tag: ProjectTags = { name: tg, id: null };
      if (typeof (tg) === 'object') {
        tag = tg;
      }

      if (this.listOfSelectedTags.findIndex(item => item.name === tag.name) < 0) {
        this.listOfSelectedTags.push(tag);

        this.saveTaskSideBar(); // save api call

      }
      this.taskFormSideBar.get('tags').patchValue('');
    }
  }

  //====================//


  public toggleActivitySidebar(el: HTMLElement) {
    this.isOpenActivitySidebar = !this.isOpenActivitySidebar;
    if (this.isOpenActivitySidebar && window.innerWidth < 768) {
      setTimeout(() => {
        el.scrollIntoView();
      }, 200);
    }
  }

  public assignedToMe() {
    this.selectedAssignee.id = this._generalService.user.id;
    this.selectedAssignee.firstName = this._generalService.user.firstName;
    this.selectedAssignee.lastName = this._generalService.user.lastName ? this._generalService.user.lastName : null;
    this.selectedAssignee.profilePic = this._generalService.user.profilePic ? this._generalService.user.profilePic : null;

    let userName = this._generalService.user.firstName ? this._generalService.user.firstName : this._generalService.user.emailId;
    if (this._generalService.user.firstName && this._generalService.user.lastName) {
      userName = userName + ' ' + this._generalService.user.lastName;
    }
    this.taskForm.get('assigneeId').patchValue(userName);
  }

  public toggleNewEpicModal() {
    this.epicModalIsVisible = !this.epicModalIsVisible;
  }

  // hold till we are not applying dirtyness check
  public createTaskConfirmation() {
    this.modal.confirm({
      nzTitle: 'Are you sure want create new task?',
      nzContent: 'All unsaved data will be clear',
      nzOnOk: () =>
        new Promise(async (resolve, reject) => {
          this.resetTaskForm();
          resolve();//close modal on ok
        }).catch((e) => {

        })
    });
  }

  public resetTaskForm() {
    this.isUpdateMode = false;
    this.taskId = null;
    this.currentTask = null;
    this.selectedStatus = null;
    this.selectedPriority = null;
    this.attachementIds = [];
    this.uploadedImages = [];
    this.listOfSelectedWatchers = [];
    this.listOfSelectedTags = [];

    if (this.taskData) {
      this.taskData.estimatedTimeReadable = null;
    }

    // reset task form if task form is already initialised
    if (this.taskForm) {
      this.taskForm.reset();
    }

    if (this.taskFormSideBar) {
      this.taskFormSideBar.reset();
    }

    this.selectAssigneeFormTaskType();
    this.selectedPriority = this.priorityDataSource.find(priority => priority.id === this.currentProject.settings.defaultTaskPriorityId);
    this.selectedStatus = this.statusDataSource.find(status => status.id === this.currentProject.settings.defaultTaskStatusId);

    this.pinnedCommentsList = null;
    this.historyList = null;
    this.progressData = null;

    if (this.selectedTaskType) {
      this.router.navigateByUrl('dashboard/task/' + this.selectedTaskType.displayName);
    } else if (this.displayName) {
      this.router.navigateByUrl('dashboard/task/' + this.displayName);
    } else {
      this.router.navigateByUrl('dashboard/task/');
    }
  }

  // Assignee from Task type source
  public selectAssigneeFormTaskType() {
    if (this.taskTypeDataSource && this.taskTypeDataSource.length > 0) {
      this.selectedTaskType = this.taskTypeDataSource.find(taskType => taskType.id === this.currentProject.settings.defaultTaskTypeId);
      this.displayName = this.selectedTaskType.displayName;
      this.selectedAssignee = { ...this.selectedTaskType.assignee };
      this.taskForm.get('assigneeId').patchValue(`${this.selectedAssignee.firstName} ${this.selectedAssignee.lastName}`);
      this.modelChanged.next();
    }
  }

  public updateCommentSuccess(data: any) {

    // from edit comment dialog
    if (!data.hasOwnProperty('isPinned')) {
      data = data as UpdateCommentModel;
      if (data.comment.id) {
        //to locally updating //
        this.showCommentsList = false;
        this.commentsList.forEach((ele) => {
          if (ele.id === data.comment.id) {
            this.showCommentsList = false;
            ele.comment = data.comment.comment;
          }
        });

        setTimeout(() => {
          this.showCommentsList = true;
        }, 1);
      }
      return;
    } else {
      // pin comment request
      data = data as CommentPinModel;
      this.showPinnedCommentsList = false;
      //to locally updating pinnedCommentsList //
      if (data.isPinned) {

        const comment: AddCommentModel = {
          comment: this.commentForm.getRawValue(),
          projectId: this._generalService.currentProject.id,
          taskId: this.taskId
        };

        comment.comment.createdBy = this._generalService.user;
        comment.comment.createdById = this._generalService.user.id;
        comment.comment.createdAt = new Date();
        comment.comment.isPinned = data.isPinned;
        if (!(data instanceof TaskComments)) {
          comment.comment.id = data.commentId;
        }
        comment.comment.comment = data.comment;
        this.pinnedCommentsList.unshift(comment.comment);
        setTimeout(() => {
          this.showPinnedCommentsList = true;
          this.cdr.detectChanges();
        }, 10);

      } else {
        // tslint:disable-next-line:no-shadowed-variable
        let data: CommentPinModel = null;
        if ((data instanceof CommentPinModel)) {
          data = data;
        }
        this.pinnedCommentsList = this.pinnedCommentsList.filter((ele) => {
          if (data && ele.id !== data.commentId) {
            return ele;
          }
        });
        setTimeout(() => {
          this.showPinnedCommentsList = true;
          this.cdr.detectChanges();
        }, 10);
      }
    }
    // this.getMessage(true); will use socket
  }

  public timeLog(data?: TaskTimeLogResponse) {
    if (data) {
      this.progressData = data;
      this.currentTask.remainingTime = data.remainingTime;
      this.currentTask.remainingTimeReadable = data.remainingTimeReadable;
    }
    this.timelogModalIsVisible = !this.timelogModalIsVisible;
  }

  public async addTaskToSprint(adjustHoursAllowed?: boolean) {
    try {

      const json: AddTaskToSprintModel = {
        projectId: this._generalService.currentProject.id,
        sprintId: this.sprintData.id,
        taskId: this.taskData.id,
        adjustHoursAllowed: adjustHoursAllowed
      };

      this.updateSidebarContentInProcess = true;
      const data = await this._sprintService.addTaskToSprint(json).toPromise();

      if (data.data) {
        // check if we found error while adding task

        if (data.data.hasOwnProperty('tasksError') || data.data.hasOwnProperty('membersError')) {
          const errorResponse = data.data as SprintErrorResponse;

          // check if error is related to tasks error or members error
          if (errorResponse.tasksError) {
            // if sprint capacity is exceeding show confirm box to allow to exceed sprint capacity
            if (errorResponse.tasksError.reason === SprintErrorEnum.sprintCapacityExceed) {

              // uncheck item code here
              await this.addTaskConfirmAfterError(this.taskData);
              return;
            } else {
              // show error toaster
              this.notification.error('Error', errorResponse.tasksError.reason);
            }
          } else {
            // if member capacity is exceeding show confirm box to allow to exceed sprint capacity
            if (errorResponse.membersError.reason === SprintErrorEnum.sprintCapacityExceed) {

              // uncheck item code here
              await this.addTaskConfirmAfterError(this.taskData);
              return;
            } else {
              // show error toaster
              this.notification.error('Error', errorResponse.tasksError.reason);
            }
          }
        } else {

          this.taskData.sprintId = this.sprintData.id;
          this.notification.success('Success', 'Task successfully added to this Sprint');
        }
      }

      this.updateSidebarContentInProcess = false;
    } catch (e) {
      console.log(e);
      this.updateSidebarContentInProcess = false;
    }
  }


  public async removeTaskToSprint() {

    try {

      return this.modal.confirm({
        nzTitle: 'Want to remove task from sprint?',
        nzContent: '',
        nzOnOk: () =>
          new Promise(async (resolve, reject) => {
            const json: RemoveTaskFromSprintModel = {
              projectId: this._generalService.currentProject.id,
              sprintId: this.sprintData.id,
              taskId: this.taskData.id
            };
            //this.updateSidebarContentInProcess = true;
            await this._sprintService.removeTaskFromSprint(json).toPromise();
            this.taskData.sprintId = null;
            //this.updateSidebarContentInProcess = false;
            setTimeout(Math.random() > 0.5 ? resolve : reject, 10);
            return true;
          }).catch(() => console.log('Oops errors!'))
      });

    } catch (e) {
      console.log(e);
      this.updateSidebarContentInProcess = false;
    }

  }


  async addTaskConfirmAfterError(task: Task) {
    return this.modal.confirm({
      nzTitle: 'Still Want to add task?',
      nzContent: 'May be this will effect your current Sprint',
      nzOnOk: () =>
        new Promise((resolve, reject) => {
          this.addTaskToSprint(true);
          setTimeout(Math.random() > 0.5 ? resolve : reject, 10);
          return true;
        }).catch(() => console.log('Oops errors!'))
    });

  }


  async getTask() {
    this.getTaskInProcess = true;
    try {
      const json: GetTaskByIdOrDisplayNameModel = {
        projectId: this._generalService.currentProject.id,
        displayName: this.displayName,
        taskId: this.taskId
      };
      const res = await this._taskService.getTask(json).toPromise();
      this.showTaskNotFoundView = false;
      this.currentTask = res.data;
      this.taskData = res.data;

      this.taskForm.patchValue(this.taskData);

      //sidebar form
      this.taskFormSideBar.get('watchers').patchValue('');
      this.taskFormSideBar.get('tags').patchValue('');
      //-------------

      this.taskId = this.taskData.id;
      this.getMessage();
      this.getHistory();
      this.selectTaskType(this.taskData.taskType as TaskTypeModel);
      this.selectStatus(this.taskData.status);
      this.selectPriority(this.taskData.priority as ProjectPriority);
      this.selectDependentItemTypeahead(this.taskData.dependentItem as Task);
      if (this.taskData.assignee && this.taskData.assigneeId) {
        this.taskData.assignee.id = this.taskData.assigneeId;
        this.selectAssigneeTypeahead(this.taskData.assignee as User);
      }
      if (this.taskData.estimatedTime) {
        this.setHoursMinutes(this.taskData.estimatedTime);
      }

      if (this.taskData && this.taskData.progress) {

        this.progressData = {
          progress: this.taskData.progress,
          totalLoggedTime: this.taskData.totalLoggedTime,
          totalLoggedTimeReadable: this.taskData.totalLoggedTimeReadable,
          remainingTimeReadable: this.taskData.remainingTimeReadable,
          overLoggedTime: this.taskData.overLoggedTime,
          overLoggedTimeReadable: this.taskData.overLoggedTimeReadable,
          overProgress: this.taskData.overProgress
        };

      }

      this.listOfSelectedWatchers = this.taskData.watchersDetails;

      if (this.taskData.tags && this.taskData.tags.length > 0) {
        this.taskData.tags.forEach(name => {
          this.listOfSelectedTags.push({ name: name, id: null });
        });
      }

      this.attachementIds = this.taskData.attachments;
      this.uploadedImages = this.taskData.attachmentsDetails;

      this.getTaskInProcess = false;
    } catch (e) {
      if (!e.data) {
        this.showTaskNotFoundView = true;
      }
      this.getTaskInProcess = false;
    }
  }

  async getMessage(hideLoader?: boolean) {
    this.showCommentsList = true;
    this.showPinnedCommentsList = true;
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

  // file selection handling
  handleChange({ file, fileList }): void {
    const status = file.status;
    if (status === 'uploading') {
      this.uploadingImage = true;
    } else {
      this.uploadingImage = false;
    }
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

  // file selection remove handling
  handleRemove = (file: any) => new Observable<boolean>((obs) => {
    this.attachementIds.splice(this.attachementIds.indexOf(file.id), 1);
    this.uploadedImages = this.uploadedImages.filter((ele) => {
      if (ele.id !== file.id) {
        return ele;
      }
    });

    obs.next(false);
  });


  // save sidebar data
  async saveTaskSideBar() {
    // Calling to estimate update and sending true to hide toaster
    this.saveForm(true);
  }

  // save left side task form on click on save button
  async saveForm(isUpdateFromSideBar?:boolean) {
    const task: Task = { ...this.taskForm.getRawValue() };

    task.projectId = this.currentProject.id;

    task.createdById = this._generalService.user.id;

    task.taskTypeId = this.selectedTaskType && this.selectedTaskType.id ? this.selectedTaskType.id : null;

    task.assigneeId = this.selectedAssignee && this.selectedAssignee.id ? this.selectedAssignee.id : null;

    task.statusId = this.selectedStatus && this.selectedStatus.id ? this.selectedStatus.id : null;

    task.priorityId = this.selectedPriority && this.selectedPriority.id ? this.selectedPriority.id : null;

    task.dependentItemId = this.selectedDependentItem && this.selectedDependentItem.id ? this.selectedDependentItem.id : null;

    task.relatedItemId = this.listOfSelectedRelatedItems;

    task.attachments = this.attachementIds;

    if (!task.taskTypeId) {
      this.notification.error('Error', 'Please select task type');
      return;
    }

    if (!task.name) {
      this.notification.error('Error', 'Please enter task title');
      return;
    }

    try {
      if (this.taskId) {

        // task estimate data from side bar if already filled
        const hours = this.taskFormSideBar.get('remainingHours').value ? this.taskFormSideBar.get('remainingHours').value : 0;
        const minutes = this.taskFormSideBar.get('remainingMinutes').value ? this.taskFormSideBar.get('remainingMinutes').value : 0;
        task.estimatedTimeReadable = hours + 'h ' + +minutes + 'm';

        this.updateTask(task, isUpdateFromSideBar);

      } else {

        task.watchers = [];
        task.tags = [];
        this.createTaskInProcess = true;

        const data = await this._taskService.createTask(task).toPromise();

        this.taskId = data.data.id;
        this.displayName = data.data.displayName;

        if (!this.taskData) {
          this.taskData = data.data;
        }

        this.selectStatus(data.data.status);
        this.selectAssigneeTypeahead(data.data.assignee);

        this.listOfSelectedWatchers = data.data.watchersDetails;

      }
      this.router.navigate(['dashboard', 'task', this.displayName], { replaceUrl: true });
      this.createTaskInProcess = false;
    } catch (e) {
      this.createTaskInProcess = false;
    }

  }

  //param:isEstimateUpdate, If true then hide success toaster
  async updateTask(task: Task, isUpdateFromSideBar?: boolean) {
    try {
      task.id = this.taskId;
      task.displayName = this.displayName;

      this.taskData.watchers = [];
      if (this.listOfSelectedWatchers && this.listOfSelectedWatchers.length > 0) {
        this.listOfSelectedWatchers.forEach(ele => {
          this.taskData.watchers.push(ele.id || ele._id);
        });
      }

      this.taskData.tags = [];
      if (this.listOfSelectedTags && this.listOfSelectedTags.length > 0) {
        this.listOfSelectedTags.forEach(ele => {
          this.taskData.tags.push(ele.name);
        });
      }

      task.watchers = this.taskData.watchers;
      task.tags = this.taskData.tags;

      if(isUpdateFromSideBar) {
        this.updateSidebarContentInProcess = true;
      }else {
        this.createTaskInProcess = true;
      }
      
      const data = await this._taskService.updateTask(task, isUpdateFromSideBar).toPromise();

      this.updateSidebarContentInProcess = false;

      this.currentTask = data.data;
      this.taskData = data.data;
      this.displayName = data.data.displayName;

      if (data && data.data && data.data.progress) {
        this.progressData = {
          progress: data.data.progress,
          totalLoggedTime: data.data.totalLoggedTime,
          totalLoggedTimeReadable: data.data.totalLoggedTimeReadable,
          remainingTimeReadable: data.data.remainingTimeReadable,
          overLoggedTime: data.data.overLoggedTime,
          overLoggedTimeReadable: data.data.overLoggedTimeReadable,
          overProgress: data.data.overProgress
        };
      }
    } catch (e) {
      this.updateSidebarContentInProcess = false;
      this.createTaskInProcess = false;
    }
  }

  public resetCommentForm() {
    this.commentForm.reset({ uuid: Date.now() });
  }

  public setHoursMinutes(seconds: number) {
    const num = seconds / 60;
    const hours = (num / 60);
    const rhours = Math.floor(hours);
    const minutes = (hours - rhours) * 60;
    const rminutes = Math.round(minutes);
    this.taskFormSideBar.get('remainingHours').patchValue(rhours);
    this.taskFormSideBar.get('remainingMinutes').patchValue(rminutes);
    return {
      h: rhours,
      m: rminutes
    };
  }

  public selectAssigneeTypeahead(user: User) {
    if (user && user.emailId) {
      this.selectedAssignee = { ...user };
      let userName = user && user.firstName ? user.firstName : user.emailId;
      if (user && user.firstName && user && user.lastName) {
        userName = userName + ' ' + user.lastName;
      }
      this.taskForm.get('assigneeId').patchValue(userName);
    }
    this.modelChanged.next();
  }

  public clearAssigeeSearchText() {
    this.taskForm.get('assigneeId').patchValue('');
    this.selectedAssignee.profilePic = null;
  }

  public selectTaskType(item: TaskTypeModel) {
    this.selectedTaskType = item;
    this.selectedAssignee = { ...item.assignee };
    this.taskForm.get('assigneeId').patchValue(`${item.assignee.firstName} ${item.assignee.lastName}`);
  }

  public selectPriority(item: ProjectPriority) {
    this.selectedPriority = item;
  }

  public selectStage(item: ProjectStages) {
    this.selectedStage = item;
  }

  public addNewTag(event) {
    this.tagsQueryText = null;
    if (event.key === 'Enter' && event.target.value) {
      this.listOfSelectedTags = this.taskForm.get('tags').value;
      this.listOfSelectedTags.push(event.target.value);
      this.taskFormSideBar.get('tags').patchValue(this.listOfSelectedTags);
      this.tagsDataSource.push(event.target.value);
      event.target.value = null;
    }
  }

  public selectStatus(item: TaskStatusModel) {
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


    //to locally updating //
    this.showCommentsList = false;
    comment.comment.createdBy = this._generalService.user;
    comment.comment.createdById = this._generalService.user.id;
    comment.comment.createdAt = new Date();
    comment.comment.isPinned = false;

    setTimeout(() => {
      this.commentsList.unshift(comment.comment);
      this.showCommentsList = true;
    }, 1);

    //--------------------//
    try {
      const newComment = await this._taskService.addComment(comment).toPromise();

      // find comment from list and update's it's id that was returned from api
      this.commentsList.forEach(cmnt => {
        if (cmnt.uuid === newComment.data.uuid) {
          cmnt.id = newComment.data.id;
        }
      });

      // reset comment form
      this.commentForm.reset({ uuid: Date.now() });
      this.createCommentInProcess = false;
    } catch (e) {
      this.createCommentInProcess = false;
    }
  }


  async getLogHistory(event?: any) {
    try {
      if (event) {
        this.getTimeLogInProcess = true;
        const json: TaskTimeLogHistoryModel = {
          taskId: this.taskId,
          projectId: this._generalService.currentProject.id
        };
        const data = await this._taskService.getLogHistory(json).toPromise();
        this.timelogHistoryList = data.data;
        this.getTimeLogInProcess = false;
      }
    } catch (e) {
      this.getTimeLogInProcess = false;
    }
  }

  public ngOnDestroy() {
    this.themeService.toggleFold(false);
  }

}
