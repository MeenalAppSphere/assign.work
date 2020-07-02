import { Permissions } from '@aavantan-app/models';

export const PERMISSIONS: Permissions = {
  sprint: {
    canCreate_sprint: false,
    canModify_sprint: false, // update and publish used as same
    canClose_sprint: false,
    canRemoveTaskToSprint_sprint: false,
    canAddTaskToSprint_sprint: false
  },
  task: {
    canAdd_task:false,
    canRemove_task:false,
    canModifyEstimate_task: false, // no api
  },
  board: {
    canModifyBoardSettings_board: false
  },
  member: {
    canAddMember_member: false,
    canRemove_member: false, // no api
  }
}

