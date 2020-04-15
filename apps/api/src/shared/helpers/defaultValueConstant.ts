import { DefaultSettingsModel } from '@aavantan-app/models';
import { ProjectTemplateEnum } from 'libs/models/src/lib/enums';
import { ProjectWorkingDays } from 'libs/models/src/lib/models';

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
    { name: 'BUG', displayName: 'BUG', color: '#FF0000', isDefault: true },
    { name: 'TASK', displayName: 'TASK', color: '#0000FF', isDefault: true },
    { name: 'Story', displayName: 'Story', color: '#008000', isDefault: true },
    { name: 'EPIC', displayName: 'EPIC', color: '#000000', isDefault: true }
  ],
  priorities: [
    { name: 'LOW', color: '#E6E6FA', isDefault: true },
    { name: 'HIGH', color: '#DC143C', isDefault: true },
    { name: 'MEDIUM', color: '#008000', isDefault: true },
    { name: 'CRITICAL', color: '#FF0000', isDefault: true }
  ]
};

// default settings for task management template
export const DEFAULT_SETTINGS_FOR_TASK_MANAGEMENT: DefaultSettingsModel = {
  taskTypes: [
    { name: 'TASK', displayName: 'TASK', color: '#0000FF', isDefault: true }
  ],
  priorities: [
    { name: 'LOW', color: '#E6E6FA', isDefault: true },
    { name: 'HIGH', color: '#DC143C', isDefault: true },
    { name: 'MEDIUM', color: '#008000', isDefault: true },
    { name: 'CRITICAL', color: '#FF0000', isDefault: true }
  ]
};

// default settings for accounting template
export const DEFAULT_SETTINGS_FOR_ACCOUNTING: DefaultSettingsModel = {
  taskTypes: [
    { name: 'GST', displayName: 'GST', color: '#0000FF', description: 'GST', isDefault: true },
    { name: 'COMP', displayName: 'COMP', color: '#008000', description: 'COMP', isDefault: true },
    { name: 'AUDIT', displayName: 'AUDIT', color: '#EE82EE', description: 'AUDIT', isDefault: true },
    { name: 'MEETINGS', displayName: 'MEETINGS', color: '#CD853F', description: 'MEETINGS', isDefault: true },
    { name: 'CALLS', displayName: 'CALLS', color: '#ADFF2F', description: 'CALLS', isDefault: true }
  ],
  priorities: [
    { name: 'LOW', description: 'LOW', color: '#E6E6FA', isDefault: true },
    { name: 'HIGH', description: 'HIGH', color: '#DC143C', isDefault: true },
    { name: 'MEDIUM', description: 'MEDIUM', color: '#008000', isDefault: true },
    { name: 'CRITICAL', description: 'CRITICAL', color: '#FF0000', isDefault: true }
  ]
};

// default settings for accounting template
export const DEFAULT_SETTINGS_FOR_PRODUCTION: DefaultSettingsModel = {
  taskTypes: [
    { name: 'STATUS', displayName: 'STATUS', color: '#0000FF', description: 'STATUS', isDefault: true }
  ],
  priorities: [
    { name: 'LOW', description: 'LOW', color: '#E6E6FA', isDefault: true },
    { name: 'HIGH', description: 'HIGH', color: '#DC143C', isDefault: true },
    { name: 'MEDIUM', description: 'MEDIUM', color: '#008000', isDefault: true },
    { name: 'CRITICAL', description: 'CRITICAL', color: '#FF0000', isDefault: true }
  ]
};
