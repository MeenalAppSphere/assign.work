import { Permissions } from '@aavantan-app/models';

export const PERMISSIONS: Permissions = {
  sprint: {
    canCreate_sprint: false,
    canUpdate_sprint: false,
    canClose_sprint: false,
    canRemoveTask_sprint: false,
    canAddTask_sprint: false
  },
  task: {
    canAdd_task:false,
    canRemove_task:false,
    canUpdateEstimate_task: false, // no api
  },
  board: {
    canUpdateBoardSettings_board: false
  },
  member: {
    canAddMember_member: false,
    canDelete_member: false, // no api
  }
}

