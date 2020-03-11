export enum TaskHistoryActionEnum {
  taskCreated = 'Task Created',
  taskUpdated = 'Task Updated',
  taskDeleted = 'Task Deleted',
  taskAssigned = 'Task Assigned',
  commentAdded = 'Comment Added',
  commentPinned = 'Comment Pinned',
  commentUpdated = 'Comment Updated',
  commentDeleted = 'Comment Deleted',
  attachmentAdded = 'Attachment Added',
  assigneeChanged = 'Assignee Changed',
  descUpdated = 'Description Updated',
  nameChanged = 'Name Changed',
  createdByChanged = 'CreatedBy Changed',
  statusChanged = 'Status Changed',
  stageChanged = 'Stage Changed',
  addedToSprint = 'Task Added To Sprint',
  removedFromSprint = 'Task Removed from Sprint',
  timeLogged = 'Time Logged',
  timeLoggedInSprint = 'Time Logged in Sprint'
}

export enum TaskFilterCondition {
  or= 'or',
  and = 'and'
}
