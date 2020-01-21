import { Document, Model } from 'mongoose';
import { Sprint } from '@aavantan-app/models';
import { BadRequestException } from '@nestjs/common';
import * as moment from 'moment';

export class SprintValidationService {
  constructor(protected readonly _sprintModel: Model<Sprint & Document>) {
  }

  /**
   * common sprint related validations
   * check name, started At, end At, goal present or not
   * check sprint start date is not before today
   * check sprint end date is not before start date
   * @param sprint
   */
  commonSprintValidator(sprint: Sprint) {
    // sprint name
    if (!sprint.name) {
      throw new BadRequestException('Sprint Name is compulsory');
    }

    // sprint goal
    if (!sprint.goal) {
      throw new BadRequestException('Sprint goal is required');
    }

    // sprint started at
    if (!sprint.startedAt) {
      throw new BadRequestException('Please select Sprint Start Date');
    }

    // sprint end at
    if (!sprint.endAt) {
      throw new BadRequestException('Please select Sprint End Date');
    }

    // started date can not be before today
    const isStartDateBeforeToday = moment(sprint.startedAt).isBefore(moment().startOf('d'));
    if (isStartDateBeforeToday) {
      throw new BadRequestException('Sprint Started date can not be Before Today');
    }

    // end date can not be before start date
    const isEndDateBeforeTaskStartDate = moment(sprint.endAt).isBefore(sprint.startedAt);
    if (isEndDateBeforeTaskStartDate) {
      throw new BadRequestException('Sprint End Date can not be before Sprint Start Date');
    }
  }

  /**
   * check whether sprint name is available or not
   * @param projectId
   * @param name
   */
  async sprintNameAvailable(projectId: string, name: string): Promise<boolean> {
    const sprintNameAvailability = await this._sprintModel.find({
      projectId: projectId, name: { $regex: new RegExp(`^${name.trim()}$`), $options: 'i' }, isDeleted: false
    }).select('name').countDocuments();

    return sprintNameAvailability === 0;
  }
}
