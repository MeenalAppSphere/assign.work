import { ProjectTemplateEnum, ProjectWorkingDays } from '@aavantan-app/models';

// default query filter
export const DEFAULT_QUERY_FILTER = {
  isDeleted: false
};

// default project template type
export const DEFAULT_PROJECT_TEMPLATE_TYPE = ProjectTemplateEnum.softwareDevelopment;

// default working capacity
export const DEFAULT_WORKING_CAPACITY: number = (40 * 3600);

// default working capacity per day
export const DEFAULT_WORKING_CAPACITY_PER_DAY: number = (8 * 3600);

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

// max file upload size in mb
export const MAX_FILE_UPLOAD_SIZE = 5;

// max profile pic upload size in mb
export const MAX_PROFILE_PIC_UPLOAD_SIZE = 2;

// default email address for sending email
export const DEFAULT_EMAIL_ADDRESS = 'aashish.patil@appsphere.in';
