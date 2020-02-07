import { BoardModel } from '@aavantan-app/models';
import { BadRequest } from '../../helpers/helpers';

export class BoardUtilityService {
  constructor() {
  }

  checkValidations(model: BoardModel) {
    if (!model.name) {
      BadRequest('Board Name is required');
    }

    if (!model.columns || !model.columns.length) {
      BadRequest('At-least one column is required for creating a Board');
    }
  }

}
