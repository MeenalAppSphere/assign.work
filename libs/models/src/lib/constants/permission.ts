import { Permissions } from '@aavantan-app/models';

// note : name always start with "can" because it in use in settings>UI
export const PERMISSIONS: Permissions = {
  sprint: {
    canCreate: true,
    canRemove: true,
    canClose: true,
  },
  task: {
    canAddToSprint: true,
    canUpdateEstimate: true,
  },
  board: {
    canUpdateBoardSettings: true
  },
  member: {
    canAdd: true,
    canDelete: true,
  }
}

