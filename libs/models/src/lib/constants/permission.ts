import { Permissions } from '@aavantan-app/models';

export const PERMISSIONS: Permissions = {
  sprint: {
    canCreate: false,
    canUpdate: false,
    canClose: false,
    canRemoveTask: false,
    canAddTask: false
  },
  task: {
    canAdd:false,
    canRemove:false,
    canUpdateEstimate: false, // no api
  },
  board: {
    canUpdateBoardSettings: false
  },
  member: {
    canAdd: false,
    canDelete: false, // no api
  }
}

