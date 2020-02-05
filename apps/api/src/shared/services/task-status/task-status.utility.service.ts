import { TaskStatusModel, TaskStatusWithCategoryModel } from '@aavantan-app/models';
import { BadRequest, isValidString } from '../../helpers/helpers';
import { remove } from 'lodash';

export class TaskStatusUtilityService {
  constructor() {
  }

  /**
   * add update normal validations checker
   * @param status
   */
  statusValidations(status: TaskStatusModel) {
    // status name available or not
    if (!status.name) {
      BadRequest('Status name is required');
    }

    // is status name has valid string
    if (!isValidString(status.name)) {
      BadRequest('No Special characters allowed in status name');
    }
  }

  /**
   * parse raw statuses with category wise statuses
   * @param statuses
   */
  parseStatusesWithCategory(statuses: TaskStatusModel[]): TaskStatusWithCategoryModel[] {
    const parsedStatuses = [];

    statuses.forEach(status => {
      if (status.isCategory) {
        const newCategory = new TaskStatusWithCategoryModel();
        newCategory.name = status.name;
        newCategory.id = status.id;
        newCategory.isCategory = true;
        newCategory.statues = remove(statuses, (innerStatus) => innerStatus.categoryId === status.id);
        parsedStatuses.push(newCategory);
      }
    });

    return parsedStatuses;
  }
}
