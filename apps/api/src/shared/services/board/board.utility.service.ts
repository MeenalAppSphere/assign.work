import { BoardModel, Project } from '@aavantan-app/models';
import { BadRequest } from '../../helpers/helpers';
import { DEFAULT_BOARD_NAME } from '../../helpers/defaultValueConstant';

export class BoardUtilityService {
  constructor() {
  }

  /**
   * check validation for creating a board
   * @param model
   */
  checkValidations(model: BoardModel) {
    if (!model.name) {
      BadRequest('Board Name is required');
    }

    if (!model.columns || !model.columns.length) {
      BadRequest('At-least one column is required for creating a Board');
    }
  }

  /**
   * prepare default board model
   * creates a board object with default status as columns
   * @param project
   */
  prepareDefaultBoardModel(project: Project) {
    const board = new BoardModel();

    board.projectId = project.id;
    board.name = DEFAULT_BOARD_NAME;
    board.columns = [];
    board.createdById = project.createdById;
    board.isDeleted = false;

    project.settings.statuses.forEach((status: any, index) => {
      board.columns.push({
        headerStatusId: status,
        includedStatusesId: [status],
        isActive: true,
        columnOrderNo: index + 1,
        columnColor: '',
        defaultAssigneeId: project.createdById
      });
    });

    return board;
  }

  /**
   * convertToVm
   * convert board object to vm
   * @param board
   */
  convertToVm(board: BoardModel): BoardModel {
    board.id = board._id;

    board.columns = board.columns.map(column => {
      column.headerStatus.id = column.headerStatus._id;
      column.defaultAssignee.id = column.defaultAssignee._id;

      column.includedStatuses = column.includedStatuses.map(includeStatus => {
        includeStatus.id = includeStatus._id;
        return includeStatus;
      });

      return column;
    });

    return board;
  }
}
