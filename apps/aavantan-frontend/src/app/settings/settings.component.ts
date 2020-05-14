import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AccessPermission,
  BoardModel,
  BoardModelBaseRequest,
  GetAllBoardsRequestModel,
  Organization,
  Project,
  ProjectMembers,
  ProjectPriority,
  ProjectStages,
  ProjectStatus,
  ProjectWorkingCapacityUpdateDto,
  ProjectWorkingDays,
  ResendProjectInvitationModel, SaveAndPublishBoardModel,
  SearchProjectCollaborators,
  SearchUserModel,
  TaskTypeModel,
  User,
  UserRoleModel
} from '@aavantan-app/models';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ValidationRegexService } from '../shared/services/validation-regex.service';
import { GeneralService } from '../shared/services/general.service';
import { ProjectService } from '../shared/services/project/project.service';
import { UserQuery } from '../queries/user/user.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { cloneDeep } from 'lodash';
import { debounceTime } from 'rxjs/operators';
import { UserService } from '../shared/services/user/user.service';
import { Subject } from 'rxjs';
import { TaskStatusQuery } from '../queries/task-status/task-status.query';
import { TaskPriorityQuery } from '../queries/task-priority/task-priority.query';
import { TaskTypeQuery } from '../queries/task-type/task-type.query';
import { TaskTypeService } from '../shared/services/task-type/task-type.service';
import { BoardQuery } from '../queries/board/board.query';
import { BoardService } from '../shared/services/board/board.service';
import { Router } from '@angular/router';
import { ProjectQuery } from '../queries/project/project.query';
import { UserRoleService } from '../shared/services/user-role/user-role.service';
import { UserRoleQuery } from '../queries/user-role/user-role.query';

@Component({
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsComponent implements OnInit, OnDestroy {
  public response: any;
  public collaboratorForm: FormGroup;
  public workflowForm: FormGroup;


  public projectModalIsVisible: boolean;
  public selectedCollaborator: User;
  public selectedCollaborators: User[] = [];
  public defaultAssigneeDataSource: User[] = [];
  public userDataSource: User[] = [];
  public collaboratorsDataSource: User[] = [];
  public isCollaboratorExits: boolean = false;
  public enableInviteBtn: boolean;
  public stageForm: FormGroup;
  public statusForm: FormGroup;
  public projectForm: FormGroup;
  public taskTypeForm: FormGroup;
  public priorityForm: FormGroup;
  public userRoleForm: FormGroup;

  public activeView: any = {
    title: 'Project',
    view: 'project'
  };
  public stagesList: any = [];
  public statusList: ProjectStatus[] = [];
  public typesList: TaskTypeModel[] = [];
  public priorityList: ProjectPriority[] = [];
  public projectMembersList: ProjectMembers[] = [];
  public projectCapacityMembersList: ProjectMembers[] = [];
  public projectListData: Project[] = [];
  public boardsList: BoardModel[] = [];

  public currentOrganization: Organization;
  public currentProject: Project = null;
  public isSearchingDefaultUser: boolean = false;
  public addCollaboratorsInProcess: boolean = false;
  public resendInviteInProcess: boolean = false;
  public removeCollaboratorInProcess: boolean = false;
  public modelChangedSearchCollaborators = new Subject<string>();
  public modelChangedSearchDefaultAssignee = new Subject<string>();
  public selectedDefaultAssignee: User = {};
  public isSearching: boolean;

  public updateRequestInProcess: boolean = false;
  public deleteStageInProcess: boolean = false;
  public deleteStatusInProcess: boolean = false;
  public deleteTaskTypeInProcess: boolean = false;
  public deletePriorityInProcess: boolean = false;
  public getProjectsInProcess: boolean = true;

  public getAllBoardsInProcess: boolean = false;
  public publishBoardInProcess: boolean = false;
  public deleteBoardInProcess: boolean = false;

  public totalCapacity: number = 0;
  public totalCapacityPerDay: number = 0;

  public addEditprojectStatusData: ProjectStatus;
  public addEditprojectPriorityData: ProjectPriority;
  public addEditprojectTaskTypeData: TaskTypeModel;
  public addStatusModalIsVisible: boolean;
  public addPriorityModalIsVisible: boolean;
  public addTaskTypeModalIsVisible: boolean;
  public getBoardListRequestModal: GetAllBoardsRequestModel = new GetAllBoardsRequestModel();


  public moveStatusModalIsVisible: boolean;

  //securitypermissions

  public permissionsList: AccessPermission[] = [
    {name:'Edit Organization', label: 'Edit Organization', id:'1', value: 'create', disabled: false, checked: false },
    {name:'Edit Project', label: 'Edit Project', id:'2', value: 'read', disabled: false, checked: false},
    {name:'Add Task', label: 'Add Task', id:'3', value: 'assign', disabled: false, checked: false },
    {name:'Edit Task', label: 'Edit Task', id:'4', value: 'write', disabled: false, checked: false}
  ];
  public permissionsCopy:AccessPermission[]=[];
  public selectedPermissions:string[];

  public updateUserRoleModalIsVisible:boolean;
  public updateUserRoleData:ProjectMembers;
  public requestRoleInProcess:boolean;
  public roleList:UserRoleModel[]= [];
  public roleData:UserRoleModel;



  public tabs:any = [
    {
      label :'Project',
      id:'project',
      icon:'project_setting.svg',
      iconActive : 'white_project_setting.svg'
    },
    {
      label :'Board Settings',
      id:'board_settings',
      icon:'board_settings.svg',
      iconActive : 'white_board_settings.svg'
    },
    {
      label :'Collaborators',
      id:'collaborators',
      icon:'collaborator.svg',
      iconActive : 'white_collaborator.svg'
    },
    {
      label :'Status',
      id:'status',
      icon:'status.svg',
      iconActive : 'white_status.svg'
    },
    {
      label :'Priority',
      id:'priority',
      icon:'priority.svg',
      iconActive : 'white_priority.svg'
    },
    {
      label :'Task Type',
      id:'taskType',
      icon:'task_type.svg',
      iconActive : 'white_task_type.svg'
    },
    {
      label :'Team Capacity',
      id:'capacity',
      icon:'team_capacity.svg',
      iconActive : 'white_team_capacity.svg'
    },
    {
      label :'Security',
      id:'security',
      icon:'security.svg',
      iconActive : 'white_security.svg'
    }
  ]

  constructor(protected notification: NzNotificationService, private FB: FormBuilder, private validationRegexService: ValidationRegexService,
              private _generalService: GeneralService, private _projectService: ProjectService, private _userQuery: UserQuery,
              private _userService: UserService, private modalService: NzModalService, private _taskTypeService: TaskTypeService,
              private _taskStatusQuery: TaskStatusQuery, private _taskPriorityQuery: TaskPriorityQuery, private _boardQuery: BoardQuery,
              private _taskTypeQuery: TaskTypeQuery, private _boardService: BoardService, private router: Router,
              private modal: NzModalService, private _projectQuery: ProjectQuery,
              private _userRolesService: UserRoleService, private _userRoleQuery: UserRoleQuery) {

    this.notification.config({
      nzPlacement: 'bottomRight'
    });

    this.getBoardListRequestModal.projectId = this._generalService.currentProject.id;
    this.getBoardListRequestModal.count = 20;
    this.getBoardListRequestModal.page = 1;
  }

  ngOnInit(): void {
    this.currentOrganization = this._generalService.currentOrganization;

    // get current project from store
    this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.currentProject = res;
        this.stagesList = res.settings.stages;
        this.projectMembersList = cloneDeep(res.members);

        this.totalCapacity = 0;
        this.totalCapacityPerDay = 0;
        if (this.projectMembersList && this.projectMembersList.length > 0) {
          this.projectCapacityMembersList = this.projectMembersList.filter((ele) => {
            if (ele.isInviteAccepted) {
              return ele;
            }
          });
          this.projectCapacityMembersList.forEach((ele) => {
            this.totalCapacity = this.totalCapacity + Number(ele.workingCapacity);
            this.totalCapacityPerDay = this.totalCapacityPerDay + Number(ele.workingCapacityPerDay);
          });
        }

        this.createProjectForm();

      }
    });

    // get all boards
    this._boardQuery.boards$.pipe(untilDestroyed(this)).subscribe(boards => {
      this.boardsList = boards;
    });

    // get all boards in process
    this._boardQuery.getAllInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.getAllBoardsInProcess = inProcess;
    });

    // publish board in process
    this._boardQuery.publishBoardInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.publishBoardInProcess = inProcess;
    });

    // delete board in process
    this._boardQuery.deleteBoardInProcess$.pipe(untilDestroyed(this)).subscribe(inProcess => {
      this.deleteBoardInProcess = inProcess;
    });

    // get all task statuses from store
    this._taskStatusQuery.statuses$.pipe(untilDestroyed(this)).subscribe(statuses => {
      this.statusList = statuses;
    });

    // get all task types from store
    this._taskTypeQuery.types$.pipe(untilDestroyed(this)).subscribe(types => {
      this.typesList = types;
    });

    // get all task priorities from store
    this._taskPriorityQuery.priorities$.pipe(untilDestroyed(this)).subscribe(priorities => {
      this.priorityList = priorities;
    });

    // get all user roles from store
    this._userRoleQuery.roles$.pipe(untilDestroyed(this)).subscribe(roles => {
      this.roleList = roles;
    });

    this.collaboratorForm = this.FB.group({
      collaborator: new FormControl(null, [Validators.required])
    });

    this.stageForm = this.FB.group({
      name: new FormControl(null, [Validators.required])
    });

    this.statusForm = this.FB.group({
      name: new FormControl(null, [Validators.required])
    });

    this.workflowForm = this.FB.group({
      name: new FormControl(null, [Validators.required])
    });

    this.createProjectForm();

    this.taskTypeForm = this.FB.group({
      displayName: new FormControl(null, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      color: new FormControl('#000000'),
      description: new FormControl(''),
      projectId: new FormControl(this.currentProject.id)
    });

    this.priorityForm = this.FB.group({
      name: new FormControl(null, [Validators.required]),
      color: new FormControl(null, [Validators.required])
    });

    this.userRoleForm = this.FB.group({
      name: new FormControl(null, [Validators.required]),
      accessPermissions: new FormControl([],[Validators.required]),
      description: new FormControl(null),
    });

    this.permissionsCopy = cloneDeep(this.permissionsList);


    this.getProjects();

    // search collaborators
    this.modelChangedSearchCollaborators
      .pipe(
        debounceTime(500))
      .subscribe(() => {
        const queryText = this.collaboratorForm.get('collaborator').value;
        let name = '';
        if (this.selectedCollaborator) {
          name = this.selectedCollaborator.firstName + ' ' + this.selectedCollaborator.lastName;
        }

        if (!queryText || this.collaboratorForm.get('collaborator').value === name) {
          return;
        }

        this.isSearching = true;
        const json: SearchUserModel = {
          organizationId: this._generalService.currentOrganization.id,
          query: queryText
        };

        this.isCollaboratorExits = false;
        this.projectMembersList.forEach((ele) => {
          if (ele.emailId === queryText) {
            this.isCollaboratorExits = true;
          }
        });


        this._userService.searchOrgUser(json).subscribe((data) => {
          this.isSearching = false;
          this.collaboratorsDataSource = data.data;
          if (this.collaboratorsDataSource && this.collaboratorsDataSource.length === 0 && !this.validationRegexService.emailValidator(queryText).invalidEmailAddress) {

            if (!this.isCollaboratorExits) {
              this.enableInviteBtn = true;
            }

          } else {
            this.enableInviteBtn = false;
          }
        });


      });
    // end search collaborators


    // search default assignee
    this.modelChangedSearchDefaultAssignee
      .pipe(
        debounceTime(500))
      .subscribe(() => {
        const queryText = this.workflowForm.get('assigneeId').value;
        const name = this.selectedDefaultAssignee.firstName + ' ' + this.selectedDefaultAssignee.lastName;
        if (!queryText || this.workflowForm.get('assigneeId').value === name) {
          return;
        }
        this.isSearchingDefaultUser = true;
        const json: SearchProjectCollaborators = {
          projectId: this._generalService.currentProject.id,
          query: queryText
        };
        this._userService.searchProjectCollaborator(json).subscribe((data) => {
          this.isSearchingDefaultUser = false;
          this.defaultAssigneeDataSource = data.data;
        });

      });
    // end search assignee

  }

  public createProjectForm() {
    this.projectForm = this.FB.group({
      id: new FormControl(this.currentProject ? this.currentProject.id : null),
      name: new FormControl(this.currentProject ? this.currentProject.name : null, [Validators.required]),
      organizationId: new FormControl(this._generalService.currentOrganization.id)
    });
  }

  public getProjects() {
    try {

      this._projectQuery.projects$.pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.projectListData = res;
        }
      });

    } catch (e) {
      this.getProjectsInProcess = false;
    }
  }

  public async getAllBoards() {
    try {
      const result = await this._boardService.getAllBoards(this.getBoardListRequestModal).toPromise();
      this.getBoardListRequestModal.page = result.data.page;
      this.getBoardListRequestModal.count = result.data.count;
      this.getBoardListRequestModal.totalItems = result.data.totalItems;
      this.getBoardListRequestModal.totalPages = result.data.totalPages;
    } catch (e) {
    }

  }

  public activeTab(view: string, title: string) {
    // get all boards list when board settings tab get's activate
    if (view === 'board_settings') {
      this.getAllBoards();
    }
    this.activeView = {
      title: title,
      view: view
    };
  }

  public saveProject() {
    this.updateProjectDetails(this.projectForm.value);
  }

  /*================== Collaborators tab ==================*/

  async removeCollaborators(user: ProjectMembers) {
    try {

      this.modalService.confirm({
        nzTitle: 'Are you sure want to remove this Collaborator from this Project?',
        nzOnOk: () => {
          this.modalService.closeAll();

          this.removeCollaboratorInProcess = false;
          const json: any = {
            projectId: this._generalService.currentProject.id,
            userId: user.userId
          };

          this.projectMembersList = this.projectMembersList.filter(item => item.emailId !== user.emailId);
          // await this._projectService.removeCollaborators(json).toPromise();
          this.removeCollaboratorInProcess = false;

        }
      });


    } catch (e) {
      this.removeCollaboratorInProcess = false;
    }
  }

  async resendInvitation(user: ProjectMembers) {
    try {
      this.resendInviteInProcess = true;
      const json: ResendProjectInvitationModel = {
        projectId: this._generalService.currentProject.id,
        invitedById: this._generalService.user.id,
        invitationToEmailId: user.emailId
      };
      await this._projectService.resendInvitation(json).toPromise();
      this.resendInviteInProcess = false;
    } catch (e) {
      this.resendInviteInProcess = false;
    }
  }

  async addMembers() {
    this.addCollaboratorsInProcess = true;
    const members: ProjectMembers[] = [];
    this.selectedCollaborators.forEach(f => {
      members.push({
        emailId: f.emailId,
        userId: f.id
      });
    });

    try {
      await this._projectService.addCollaborators(this.currentProject.id, members).toPromise();
      this.selectedCollaborators = [];
      this.addCollaboratorsInProcess = false;
      this.collaboratorForm.get('collaborator').patchValue('');
    } catch (e) {
      this.addCollaboratorsInProcess = false;
    }
  }

  public addCollaborators(isInvite?: boolean) {
    let emailData = null;

    if (isInvite) {
      emailData = this.collaboratorForm.get('collaborator').value;
    } else {
      emailData = this.selectedCollaborator.emailId;
    }

    const user: User = {
      emailId: emailData,
      id: this.selectedCollaborator ? this.selectedCollaborator.id : null
    };

    this.response = this.validationRegexService.emailValidator(user.emailId);
    if (this.selectedCollaborators.filter(item => item.emailId === user.emailId).length === 0) {
      if (!this.response.invalidEmailAddress) {
        this.projectMembersList.push({
          userId: user.id,
          emailId: user.emailId,
          isEmailSent: true,
          isInviteAccepted: false
        });
        this.selectedCollaborators.push(user);
        this.selectedCollaborator = null;
        this.enableInviteBtn = false;
        this.addMembers();
      }
    }
  }

  public selectAssigneeTypeahead(user: User) {
    if (user && user.emailId) {
      this.selectedCollaborator = user;
      this.addCollaborators();
    }
    this.modelChangedSearchCollaborators.next();
  }

  public toggleUpdateUserRoleShow(item?: ProjectMembers) {
    if(item) {
      this.updateUserRoleData = item;
    }
    this.updateUserRoleModalIsVisible = !this.updateUserRoleModalIsVisible;
  }



  /*================== Stage tab ==================*/
  public addStage() {
    if (this.stageForm.invalid) {
      this.notification.error('Error', 'Please check Stage title');
      return;
    }
    this.updateRequestInProcess = true;
    const stageData: ProjectStages = this.stageForm.value;
    stageData.name = stageData.name.trim();

    this._projectService.addStage(this.currentProject.id, stageData).subscribe((res => {
      this.stageForm.reset();
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));
  }

  public removeStage(stage: ProjectStages) {
    this.deleteStageInProcess = true;
    this._projectService.removeStage(this.currentProject.id, stage.id).subscribe((res => {
      this.deleteStageInProcess = false;
    }), (error => {
      this.deleteStageInProcess = false;
    }));
  }

  public reorderList(ev: any) {
    console.log(this.stagesList);
  }

  /*================ Status ==================*/
  public addStatus() {

    if (this.statusForm.invalid) {
      this.notification.error('Error', 'Please check Status title');
      return;
    }

    const statusData: ProjectStatus = this.statusForm.value;
    statusData.name = statusData.name.trim();
    this.updateRequestInProcess = true;

    this._projectService.addStatus(this.currentProject.id, statusData).subscribe((res => {
      this.statusForm.reset();
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));
  }

  public removeStatus(status: ProjectStatus) {
    this.deleteStatusInProcess = true;

    try {
      this.modal.confirm({
        nzTitle: 'Do you really want to remove status?',
        nzContent: '',
        nzOnOk: () =>
          new Promise(async (resolve, reject) => {

            // await this._projectService.removeStatus(this.currentProject.id, status.id);

            this.moveStatusModalIsVisible = true;

            setTimeout(Math.random() > 0.5 ? resolve : reject, 10);

            resolve();
          }).catch(() => console.log('Oops errors!'))
      });
    } catch (e) {
      console.log(e);
    }

  }

  public toggleMoveStatusShow(data: any) {
    this.moveStatusModalIsVisible = !this.moveStatusModalIsVisible;
  }

  public toggleAddStatusShow(item?: ProjectStatus) {
    if (item) {
      this.addEditprojectStatusData = item;
    } else {
      this.addEditprojectStatusData = null;
    }
    this.addStatusModalIsVisible = !this.addStatusModalIsVisible;
  }

  public removePriority(item: ProjectPriority) {
    this.deletePriorityInProcess = true;
    this._projectService.removePriority(this.currentProject.id, item.id).subscribe((res => {
      this.deletePriorityInProcess = false;
    }), (error => {
      this.deletePriorityInProcess = false;
    }));
  }

  public toggleAddPriorityShow(item?: ProjectPriority) {
    if (item) {
      this.addEditprojectPriorityData = item;
    } else {
      this.addEditprojectPriorityData = null;
    }
    this.addPriorityModalIsVisible = !this.addPriorityModalIsVisible;
  }

  //================== task type ==================//
  public saveTaskType() {
    if (this.taskTypeForm.invalid) {
      this.notification.error('Error', 'Please check Display name, Color and Task type');
      return;
    }
    const dup: TaskTypeModel[] = this.typesList.filter((ele) => {
      if (ele.color === this.taskTypeForm.value.color || ele.name === this.taskTypeForm.value.name || ele.displayName === this.taskTypeForm.value.displayName) {
        return ele;
      }
    });

    if (dup && dup.length > 0) {
      this.notification.error('Error', 'Duplicate Display Name, Color or Task type');
      return;
    }
    this.updateRequestInProcess = true;
    this._taskTypeService.createTaskType(this.taskTypeForm.value).subscribe((res => {
      this.taskTypeForm.reset({ projectId: this.currentProject.id });
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));
  }

  public removeTaskType(taskType: TaskTypeModel) {
    this.deleteTaskTypeInProcess = true;
    this._projectService.removeTaskType(this.currentProject.id, taskType.id).subscribe((res => {
      this.deleteTaskTypeInProcess = false;
    }), (error => {
      this.deleteTaskTypeInProcess = false;
    }));
  }

  public toggleAddTaskTypeShow(item?: TaskTypeModel) {
    if (item) {
      this.addEditprojectTaskTypeData = item;
    } else {
      this.addEditprojectTaskTypeData = null;
    }
    this.addTaskTypeModalIsVisible = !this.addTaskTypeModalIsVisible;
  }


  public copyName() {
    // this.taskTypeForm.get('displayName').patchValue(this.taskTypeForm.get('name').value);
  }

  //================== capacity ==================//
  public selectDay(wd: ProjectWorkingDays, userRow: ProjectMembers) {
    if (wd.selected) {
      wd.selected = false;
    } else {
      wd.selected = true;
    }
    const countSelected = userRow.workingDays.filter((ele) => {
      if (ele.selected) {
        return ele;
      }
    });
    userRow.workingCapacity = userRow.workingCapacityPerDay * countSelected.length;
    this.calculateTotal();
  }

  public saveCapacity() {
    const capacityList: ProjectWorkingCapacityUpdateDto[] = [];
    this.totalCapacity = 0;
    this.totalCapacityPerDay = 0;
    this.projectCapacityMembersList.forEach((ele) => {
      this.totalCapacity = this.totalCapacity + Number(ele.workingCapacity);
      this.totalCapacityPerDay = this.totalCapacityPerDay + Number(ele.workingCapacityPerDay);
      const obj: ProjectWorkingCapacityUpdateDto = {
        userId: ele.userId,
        workingCapacityPerDay: ele.workingCapacityPerDay,
        workingCapacity: ele.workingCapacity,
        workingDays: ele.workingDays
      };
      capacityList.push(obj);
    });

    this.updateRequestInProcess = true;
    this._projectService.updateCapacity(this.currentProject.id, capacityList).subscribe((res => {
      // this.taskTypeForm.reset();
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));
  }

  public calculateTotal() {
    this.totalCapacity = 0;
    this.totalCapacityPerDay = 0;

    if (this.projectCapacityMembersList && this.projectMembersList.length > 0) {
      this.projectCapacityMembersList.forEach((ele) => {

        const countSelected = ele.workingDays.filter((ele1) => {
          if (ele1.selected) {
            return ele1;
          }
        });
        ele.workingCapacity = ele.workingCapacityPerDay * countSelected.length;

        this.totalCapacity = this.totalCapacity + Number(ele.workingCapacity);
        this.totalCapacityPerDay = this.totalCapacityPerDay + Number(ele.workingCapacityPerDay);

      });
    }

  }

  //================== project tab ==================//
  public updateProjectDetails(project: Partial<Project>) {
    this.updateRequestInProcess = true;
    this._projectService.updateProject(project).subscribe((res => {
      this.updateRequestInProcess = false;
    }), (error => {
      this.updateRequestInProcess = false;
    }));

  }

  projectModalShow(): void {
    this.projectModalIsVisible = !this.projectModalIsVisible;
  }

  //================== workflow =====================//

  public selectDefaultAssigneeTypeahead(user: User) {
    if (user && user.emailId) {
      this.selectedDefaultAssignee = user;
      let userName = user && user.firstName ? user.firstName : user.emailId;
      if (user && user.firstName && user && user.lastName) {
        userName = userName + ' ' + user.lastName;
      }
      this.workflowForm.get('assigneeId').patchValue(userName);
    }
    this.modelChangedSearchDefaultAssignee.next();
  }

  public editBoard(boardId: string) {
    this.router.navigate(['dashboard', 'board-setting', boardId]);
  }

  public async publishBoard(boardId: string) {
    const request = new SaveAndPublishBoardModel();
    request.boardId = boardId;
    request.projectId = this._generalService.currentProject.id;

    try {

      this.modal.confirm({
        nzTitle: 'You want to Publish?',
        nzContent: '',
        nzOnOk: () =>
          new Promise(async (resolve, reject) => {

            await this._boardService.publishBoard(request).toPromise();
            this.getAllBoards();
            setTimeout(Math.random() > 0.5 ? resolve : reject, 10);

          }).catch(() => console.log('Oops errors!'))
      });
    } catch (e) {
      console.log(e);
    }
  }

  public async deleteBoard(boardId: string) {
    const request = new BoardModelBaseRequest();
    request.boardId = boardId;
    request.projectId = this._generalService.currentProject.id;

    try {

      this.modal.confirm({
        nzTitle: 'You want to delete?',
        nzContent: '',
        nzOnOk: () =>
          new Promise(async (resolve, reject) => {

            await this._boardService.deleteBoard(request).toPromise();
            this.getAllBoards();

            setTimeout(Math.random() > 0.5 ? resolve : reject, 10);

          }).catch(() => console.log('Oops errors!'))
      });

    } catch (e) {
      console.log(e);
    }
  }

  public boardPageChanged(pageNo: number) {
    this.getBoardListRequestModal.page = pageNo;
    this.getAllBoards();
  }

  public boardSortOrderChanged(sort: { key: string; value: string }) {
    this.getBoardListRequestModal.sort = sort.key;
    this.getBoardListRequestModal.sortBy = sort.value === 'ascend' ? 'desc' : 'asc';
    this.getAllBoards();
  }


  //================== security =====================//

  async saveUserRole() {

    try {
      if (this.userRoleForm.invalid) {
        this.notification.error('Error', 'Please check Role');
        return;
      }

      const json:UserRoleModel = {...this.userRoleForm.getRawValue()};
      json.projectId = this._generalService.currentProject.id;

      // update role
      if (this.roleData && this.roleData.id) {
        json.id = this.roleData.id;
        this.updateRequestInProcess = true;
        await this._userRolesService.updateRole(json).toPromise();
        this.updateRequestInProcess = false;
        this.roleData = {name : ''};

      } else { // add role

        const dup: UserRoleModel[] = this.roleList.filter((ele) => {
          if (ele.name === this.userRoleForm.value.name) {
            return ele;
          }
        });

        if (dup && dup.length > 0) {
          this.notification.error('Error', 'Duplicate name not allowed');
          return;
        }

        this.updateRequestInProcess = true;
        await this._userRolesService.createRole(json).toPromise();
        this.userRoleForm.reset();
        this.updateRequestInProcess = false;

      }
    }catch (e) {
      this.updateRequestInProcess = false;
    }
  }


  // remove role
  public removeRole(item:UserRoleModel) {

  }

  // start edit
  public startEditRole(item:UserRoleModel) {

    console.log(this.selectedPermissions);

    this.permissionsList.forEach((ele)=>{
      ele.checked = true;
    });

    this.roleData = item;
    this.userRoleForm.patchValue(item);
  }

  // cancel/reset edit
  public cancelEdit() {
    this.permissionsList = cloneDeep(this.permissionsCopy);
    this.roleData = { name :'' };
    this.userRoleForm.reset();
  }

  public selectPermission(value:string[]) {

    this.selectedPermissions = value;
    this.userRoleForm.get('accessPermissions').patchValue(value);
    console.log(value);

  }

  public ngOnDestroy(): void {
  }

}
