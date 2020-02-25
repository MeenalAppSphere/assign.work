import { Project, Task } from '@aavantan-app/models';
import { BoardUtilityService } from '../board/board.utility.service';

export class TaskUtilityService {
  private _boardUtilityService: BoardUtilityService;

  constructor() {
    this._boardUtilityService = new BoardUtilityService();
  }

  /**
   * prepare task object for saving to db
   * @param model
   * @param project
   */
  prepareTaskObjectFromRequest(model: Task, project: Project): Task {
    const taskModel = new Task();
    taskModel.name = model.name;
    taskModel.projectId = model.projectId;
    taskModel.watchers = model.watchers || [];
    taskModel.description = model.description;
    taskModel.tags = model.tags;

    taskModel.taskTypeId = model.taskTypeId;
    taskModel.priorityId = model.priorityId;

    // if no status found than assign project's active board first column's status as default status
    taskModel.statusId = model.statusId || project.activeBoard.columns[0].headerStatusId;

    taskModel.sprint = null;

    taskModel.dependentItemId = model.dependentItemId;
    taskModel.relatedItemId = model.relatedItemId || [];

    taskModel.estimatedTime = 0;
    taskModel.remainingTime = 0;
    taskModel.overLoggedTime = 0;
    taskModel.totalLoggedTime = 0;
    taskModel.progress = 0;
    taskModel.overProgress = 0;

    return taskModel;
  }

}
