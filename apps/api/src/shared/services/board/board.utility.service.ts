import { BoardColumns, BoardModel, Project } from '@aavantan-app/models';
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
        includedStatuses: [{
          statusId: status,
          defaultAssigneeId: project.createdById
        }],
        isActive: true,
        columnOrderNo: index + 1,
        columnColor: ''
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
      if (column.headerStatus) {
        column.headerStatus.id = column.headerStatus._id;
      }

      if (column.includedStatuses && column.includedStatuses.length) {
        column.includedStatuses = column.includedStatuses.map(includeStatus => {

          if (includeStatus.defaultAssignee) {
            includeStatus.defaultAssignee.id = includeStatus.defaultAssignee._id;
          }

          if (includeStatus.status) {
            includeStatus.status.id = includeStatus.status._id;
          }
          return includeStatus;
        });
      }

      return column;
    });

    return board;
  }

  getColumnIndex(columns: BoardColumns[], columnId: string): number {
    return columns.findIndex(col => col.headerStatusId.toString() === columnId);
  }

  getStatusIndex(columns: BoardColumns[], columnIndex: number, statusId: string): number {
    return columns[columnIndex].includedStatuses.findIndex(includedStatus => {
      return includedStatus.statusId.toString() === statusId;
    });
  }

  getColumnIndexFromStatus(board: BoardModel, statusId: string): number {
    return board.columns.findIndex(column => {
      return column.includedStatuses.some(status => status.statusId.toString() === statusId);
    });
  }

  addColumnAtSpecificIndex(board: BoardModel, columnIndex: number, column: BoardColumns) {
    board.columns.splice(columnIndex, 0, column);
  }

  removeColumnFromBoard(board: BoardModel, columnIndex: number): BoardColumns {
    return board.columns.splice(columnIndex, 1)[0];
  }

  unMergeStatusFromAColumn(board: BoardModel, columnIndex: number, statusId: string) {
    board.columns[columnIndex].includedStatuses.filter(includedStatus => includedStatus.statusId.toString() !== statusId);
  }

  reassignColumnOrderNo(board: BoardModel): BoardColumns[] {
    return board.columns.map((column, index) => {
      column.columnOrderNo = index + 1;
      return column;
    });
  }

}
