import { DefaultSettingsModel, ProjectTemplateEnum, ProjectWorkingDays } from '@aavantan-app/models';

// default query filter
export const DEFAULT_QUERY_FILTER = {
  isDeleted: false
};

// default paginated items count
export const DEFAULT_PAGINATED_ITEMS_COUNT = 10;

// default date format
export const DEFAULT_DATE_FORMAT = 'DD-MM-YYYY';

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
export const DEFAULT_EMAIL_ADDRESS = 'support@assign.work';

// default path for storing email templates
export const DEFAULT_EMAIL_TEMPLATE_PATH = 'shared/email-templates/';

// default invitation link expiry in seconds
export const DEFAULT_INVITATION_EXPIRY = 259200;

// default reset password code expiry in seconds
export const DEFAULT_RESET_PASSWORD_CODE_EXPIRY = 10800;

// max transaction retry timeout in seconds
export const MAX_TRANSACTION_RETRY_TIMEOUT = 120000;

// default board name that will be created when you create a project
export const DEFAULT_BOARD_NAME = 'BOARD - 1';

// default settings for software development template
export const DEFAULT_SETTINGS_FOR_SOFTWARE_DEVELOPMENT: DefaultSettingsModel = {
  taskTypes: [
    { name: 'BUG', displayName: 'BUG', color: '#FF0000', description: 'BUG' },
    { name: 'TASK', displayName: 'TASK', color: '#0000FF', description: 'TASK' },
    { name: 'Story', displayName: 'Story', color: '#008000', description: 'Story' },
    { name: 'EPIC', displayName: 'EPIC', color: '#000000', description: 'EPIC' }
  ],
  priorities: [
    { name: 'LOW', description: 'LOW', color: '#E6E6FA' },
    { name: 'HIGH', description: 'HIGH', color: '#DC143C' },
    { name: 'MEDIUM', description: 'MEDIUM', color: '#008000' },
    { name: 'CRITICAL', description: 'CRITICAL', color: '#FF0000' }
  ]
};

// default settings for task management template
export const DEFAULT_SETTINGS_FOR_TASK_MANAGEMENT: DefaultSettingsModel = {
  taskTypes: [
    { name: 'TASK', displayName: 'TASK', color: '#0000FF', description: 'TASK' }
  ],
  priorities: [
    { name: 'LOW', description: 'LOW', color: '#E6E6FA' },
    { name: 'HIGH', description: 'HIGH', color: '#DC143C' },
    { name: 'MEDIUM', description: 'MEDIUM', color: '#008000' },
    { name: 'CRITICAL', description: 'CRITICAL', color: '#FF0000' }
  ]
};

// default settings for accounting template
export const DEFAULT_SETTINGS_FOR_ACCOUNTING: DefaultSettingsModel = {
  taskTypes: [
    { name: 'GST', displayName: 'GST', color: '#0000FF', description: 'GST' },
    { name: 'COMP', displayName: 'COMP', color: '#008000', description: 'COMP' },
    { name: 'AUDIT', displayName: 'AUDIT', color: '#EE82EE', description: 'AUDIT' },
    { name: 'MEETINGS', displayName: 'MEETINGS', color: '#CD853F', description: 'MEETINGS' },
    { name: 'CALLS', displayName: 'CALLS', color: '#ADFF2F', description: 'CALLS' }
  ],
  priorities: [
    { name: 'LOW', description: 'LOW', color: '#E6E6FA' },
    { name: 'HIGH', description: 'HIGH', color: '#DC143C' },
    { name: 'MEDIUM', description: 'MEDIUM', color: '#008000' },
    { name: 'CRITICAL', description: 'CRITICAL', color: '#FF0000' }
  ]
};
