import { BoardColumns, BoardModel, Project, TaskStatusModel } from '@aavantan-app/models';
import { BadRequest, generateUtcDate } from '../../helpers/helpers';
import { DEFAULT_BOARD_NAME } from '../../helpers/defaultValueConstant';

export class BoardUtilityService {
  constructor() {
  }

  /**
   * check validation for creating/ updating a board
   * @param model
   */
  checkValidations(model: BoardModel) {
    if (!model.name) {
      BadRequest('Board Name is required');
    }

    // if (!model.columns || !model.columns.length) {
    //   BadRequest('At-least one column is required for creating a Board');
    // }
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
    board.publishedById = project.createdById;
    board.publishedAt = generateUtcDate();
    board.isPublished = true;

    project.settings.statuses.forEach((status: any, index) => {
      board.columns.push({
        headerStatusId: status,
        includedStatuses: [{
          statusId: status,
          defaultAssigneeId: project.createdById,
          isShown: true
        }],
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
   * @param statuses
   */
  convertToVm(board: BoardModel, statuses: TaskStatusModel[] = []): BoardModel {
    board.id = board._id;

    // get all already mapped statuses from board columns
    const alreadyMappedStatuses: string[] = [];

    // map over columns
    board.unMappedColumns = [];
    board.columns = board.columns.map(column => {

      // set column header status id
      if (column.headerStatus) {
        column.headerStatus.id = column.headerStatus._id;
      }

      // set column included status id's
      if (column.includedStatuses && column.includedStatuses.length) {
        column.includedStatuses = column.includedStatuses.filter(col => col.isShown).map(includeStatus => {

          // set included status default assignee id's
          if (includeStatus.defaultAssignee) {
            includeStatus.defaultAssignee.id = includeStatus.defaultAssignee._id;
          }

          // set included status id
          if (includeStatus.status) {
            includeStatus.status.id = includeStatus.status._id;
          }

          // push status to already mapped statuses
          // if column is hidden than don't push them to mappedStatuses because it's not going to show in board
          if (!column.isHidden) {
            alreadyMappedStatuses.push(includeStatus.statusId.toString());
          }

          return includeStatus;
        });
      }

      // if column is hidden then push it to un mapped columns array
      if (column.isHidden) {
        board.unMappedColumns.push(column);
      }

      return column;
    });

    // filter out all the hidden columns
    board.columns = board.columns.filter(column => !column.isHidden);

    // filter already mapped statuses and assign it to unMapped statuses
    board.unMappedStatuses = statuses.filter(status => {
      return !alreadyMappedStatuses.some(mStatus => mStatus.toString() === status._id.toString());
    });
    return board;
  }

  /**
   * get column index by column id from board columns
   * @param columns
   * @param columnId
   */
  getColumnIndex(columns: BoardColumns[], columnId: string): number {
    return columns.findIndex(col => col.headerStatusId.toString() === columnId);
  }

  /**
   * get status index from a board column
   * @param columns
   * @param columnIndex
   * @param statusId
   */
  getStatusIndex(columns: BoardColumns[], columnIndex: number, statusId: string): number {
    return columns[columnIndex].includedStatuses.findIndex(includedStatus => {
      return includedStatus.statusId.toString() === statusId;
    });
  }

  /**
   * get column index by status id from board columns
   * @param board
   * @param statusId
   */
  getColumnIndexFromStatus(board: BoardModel, statusId: string = ''): number {
    return board.columns.findIndex(column => {
      return column.includedStatuses.some(status => status.statusId.toString() === statusId.toString());
    });
  }

  /***
   * add a columns at a specific index in board
   * @param board
   * @param columnIndex
   * @param column
   */
  addColumnAtSpecificIndex(board: BoardModel, columnIndex: number, column: BoardColumns) {
    board.columns.splice(columnIndex, 0, column);
  }

  /**
   * removes a column from a board
   * @param board
   * @param columnIndex
   */
  removeColumnFromBoard(board: BoardModel, columnIndex: number): BoardColumns {
    return board.columns.splice(columnIndex, 1)[0];
  }

  /**
   * removes a status from a column
   * @param board
   * @param columnIndex
   * @param statusId
   */
  unMergeStatusFromAColumn(board: BoardModel, columnIndex: number, statusId: string) {
    board.columns[columnIndex].includedStatuses = board.columns[columnIndex].includedStatuses.filter(includedStatus => includedStatus.statusId.toString() !== statusId);
  }

  /**
   * re assignee column order no after column alteration happens
   * @param board
   */
  reassignColumnOrderNo(board: BoardModel): BoardColumns[] {
    return board.columns.map((column, index) => {
      column.columnOrderNo = index + 1;
      return column;
    });
  }

  /**
   * filter hidden status from all the status from the all the columns from a board
   * @param board
   */
  filterHiddenStatues(board: BoardModel): TaskStatusModel[] {
    const statues: TaskStatusModel[] = [];
    board.columns.forEach(column => {
      column.includedStatuses.forEach(status => {
        if (!status.isShown) {
          if (status.status) {
            status.status.id = status.status._id;
          }
          statues.push(status.status);
        }
      });
    });

    return statues;
  }
}
