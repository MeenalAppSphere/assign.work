import { TaskPriorityModel, TaskTypeModel } from './models';

export interface OneTimeMessagesDismissed {
  showTour: boolean;
}

export enum MemberTypes {
  'alien' = 'alien',
  'normal' = 'normal'
}

export interface DefaultSettingsModel {
  taskTypes: TaskTypeModel[]
  priorities: TaskPriorityModel[]
}
