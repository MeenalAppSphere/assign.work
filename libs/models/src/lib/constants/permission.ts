import { Permissions } from '@aavantan-app/models';


// Note : If you changed any object key then update 'AccessRoleGroupEnum' and settings tabs
export const PERMISSIONS: Permissions = {
  project: {
    canAdd_project: false,
    canModify_project: false,
  },
  boardSettings: {
    canViewBoardSettings_board: false,
    canAddBoardSettings_board: false,
    canModifyBoardSettings_board: false,
    canRemoveBoardSettings_board: false
  },
  collaborators: {
    canViewList_member: false,
    canAddMember_member: false,
    canRemove_member: false // no api
  },
  status: {
    canView_status:false,
    canAdd_status:false,
    canModify_status:false
  },
  priority:{
    canView_priority:false,
    canAdd_priority:false,
    canModify_priority:false
  },
  taskType:{
    canView_tasktype:false,
    canAdd_tasktype:false,
    canModify_tasktype:false
  },
  teamCapacity:{
    canView_teamcapacity:false,
    canAdd_teamcapacity:false,
    canModify_teamcapacity:false,
  },
  sprint: {
    canCreate_sprint: false,
    canModify_sprint: false, // update and publish used as same
    canClose_sprint: false,
    canAddTaskToSprint_sprint: false,
    canRemoveTaskToSprint_sprint: false
  },
  task: {
    canAdd_task:false,
    canModifyEstimate_task: false, // no api
    canRemove_task:false
  },
}

