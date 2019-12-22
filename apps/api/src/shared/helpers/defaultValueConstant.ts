import { ProjectTemplateEnum, ProjectWorkingDays } from '@aavantan-app/models';

// default query filter
export const DEFAULT_QUERY_FILTER = {
  isDeleted: false
};

// default project template type
export const DEFAULT_PROJECT_TEMPLATE_TYPE = ProjectTemplateEnum.software;

// default working capacity
export const DEFAULT_WORKING_CAPACITY: number = 40;

// default working capacity per day
export const DEFAULT_WORKING_CAPACITY_PER_DAY: number = 8;

// default working days object
export const DEFAULT_WORKING_DAYS: ProjectWorkingDays[] = [{
  day: 'mon', selected: true
}, {
  day: 'tue', selected: true
}, {
  day: 'wed', selected: true
}, {
  day: 'thr', selected: true
}, {
  day: 'fri', selected: true
}, {
  day: 'sat', selected: false
}, {
  day: 'sun', selected: false
}];
