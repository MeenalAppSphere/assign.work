export enum SprintStatusEnum {
  'inProgress' = 'inprogress',
  'completed' = 'completed',
  'closed' = 'closed'
}

export enum SprintErrorEnum {
  taskNotFound = 'Task not Found',
  taskNoAssignee = 'Please assign an assignee to Add Task in the Sprint',
  taskNoEstimate = 'Please add task estimation',
  alreadyInSprint = 'Task is already in a sprint',
  memberCapacityExceed = 'Member working capacity limit is exceeded',
  sprintCapacityExceed = 'Sprint Capacity limit is exceeded',
  memberNotFound = 'Member not found in sprint'
}

export enum SprintActionEnum {
  taskMovedToColumn = 'Task moved to a new column in Sprint'
}
