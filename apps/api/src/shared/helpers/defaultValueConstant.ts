import { ProjectTemplateEnum, ProjectWorkingDays } from '@aavantan-app/models';
import { hourToSeconds } from './helpers';

// default query filter
export const DEFAULT_QUERY_FILTER = {
  isDeleted: false
};

// default project template type
export const DEFAULT_PROJECT_TEMPLATE_TYPE = ProjectTemplateEnum.software;

// default working capacity
export const DEFAULT_WORKING_CAPACITY: number = hourToSeconds(40);

// default working capacity per day
export const DEFAULT_WORKING_CAPACITY_PER_DAY: number = hourToSeconds(8);

// default working days object
export const DEFAULT_WORKING_DAYS: ProjectWorkingDays[] = [{
  day: 'mon', selected: true
}, {
  day: 'tue', selected: true
}, {
  day: 'wed', selected: true
}, {
  day: 'thu', selected: true
}, {
  day: 'fri', selected: true
}, {
  day: 'sat', selected: false
}, {
  day: 'sun', selected: false
}];

// default decimal places
export const DEFAULT_DECIMAL_PLACES = 2;
