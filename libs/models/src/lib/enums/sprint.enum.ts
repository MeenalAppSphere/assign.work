export enum SprintStatusEnum {
  'inProgress' = 'inprogress',
  'completed' = 'completed',
  'closed' = 'closed'
}

export enum SprintErrorEnum {
  taskNotFound = 'Task not Found',
  taskNoAssignee = 'Please assign a Assignee to Add Task in the Sprint',
  taskNoEstimate = 'Please add Task Estimation',
  alreadyInSprint = 'Task is already in a sprint',
  memberCapacityExceed = 'Member Working Capacity Limit is Exceeded',
  sprintCapacityExceed = 'Sprint Capacity Limit is Exceeded',
  memberNotFound = 'Member not found in Sprint'
}

export enum SprintActionEnum {
  taskMovedToColumn = 'Task moved to a new column in Sprint'
}
