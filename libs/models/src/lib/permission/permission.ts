const PERMISSIONS = {
  sprint: {
    canRemove :true,
    canCreate:true,
    canClose:true,
  },
  task : {
    canAddToSprint :true,
    canUpdateEstimate:true,
  },
  board: {
    canUpdateBoardSettings:true
  },
  member: {
    canAdd:true,
    canDelete:true,
  }
}
