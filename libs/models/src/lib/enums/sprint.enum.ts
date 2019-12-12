export enum SprintStatusEnum {
  'inProgress' = 'inprogress',
  'completed' = 'completed',
  'closed' = 'closed'
}

export enum SprintErrorEnum {
  taskNotFound = 'Task not Found',
  taskNoAssignee = 'Task Assignee Not Added',
  taskNoEstimate = 'Estimation Is Not Added',
  memberCapacityExceed = 'Member Working Capacity Limit is Exceeded'
}
