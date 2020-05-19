import { Permissions } from '@aavantan-app/models';

// note : name always start with "can" because it in use in settings>UI
export const PERMISSIONS: Permissions = {
  sprint: {
    canCreate: false,
    canRemove: false,
    canClose: false,
  },
  task: {
    canAddToSprint: false,
    canUpdateEstimate: false,
  },
  board: {
    canUpdateBoardSettings: false
  },
  member: {
    canAdd: false,
    canDelete: false,
  }
}

