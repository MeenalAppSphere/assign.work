import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbCollection } from '@aavantan-app/models';
import { userSchema } from '../users/users.schema';
import { projectSchema } from '../project/project.schema';
import { organizationSchema } from '../organization/organization.schema';
import { UsersService } from './services/users.service';
import { ProjectService } from './services/project.service';
import { OrganizationService } from './services/organization.service';
import { TaskService } from './services/task.service';
import { taskSchema } from '../task/task.schema';
import { taskHistorySchema } from '../task-history/task-history.schema';
import { TaskHistoryService } from './services/task-history.service';
import { attachmentSchema } from '../attachment/attachment.schema';
import { AttachmentService } from './services/attachment.service';
import { EasyconfigModule } from 'nestjs-easyconfig';
import * as path from 'path';
import { GeneralService } from './services/general.service';
import { TaskTimeLogService } from './services/task-time-log.service';
import { taskTimeLogSchema } from '../task-time-log/task-time-log.schema';
import { sprintSchema } from '../sprint/sprint.schema';
import { SprintService } from './services/sprint.service';
import { taskTypeSchema } from '../task-type/task-type.schema';
import { TaskTypeService } from './services/task-type.service';

const providers = [
  UsersService,
  ProjectService,
  OrganizationService,
  TaskService,
  TaskHistoryService,
  AttachmentService,
  GeneralService,
  TaskTimeLogService,
  SprintService,
  TaskTypeService
];

const dbModels = [{
  name: DbCollection.users,
  schema: userSchema,
  collection: DbCollection.users
}, {
  name: DbCollection.projects,
  schema: projectSchema,
  collection: DbCollection.projects
}, {
  name: DbCollection.organizations,
  schema: organizationSchema,
  collection: DbCollection.organizations
}, {
  name: DbCollection.tasks,
  schema: taskSchema,
  collection: DbCollection.tasks
}, {
  name: DbCollection.taskHistory,
  schema: taskHistorySchema,
  collection: DbCollection.taskHistory
}, {
  name: DbCollection.attachments,
  schema: attachmentSchema,
  collection: DbCollection.attachments
}, {
  name: DbCollection.taskTimeLog,
  schema: taskTimeLogSchema,
  collection: DbCollection.taskTimeLog
}, {
  name: DbCollection.sprint,
  schema: sprintSchema,
  collection: DbCollection.sprint
}, { name: DbCollection.taskType, schema: taskTypeSchema, collection: DbCollection.taskType }];

@Global()
@Module({
  imports: [
    EasyconfigModule.register({ path: path.resolve(__dirname, '.env') }),
    MongooseModule.forFeature(dbModels)
  ],
  exports: [
    MongooseModule,
    ...providers
  ],
  providers: [
    ...providers
  ]
})
export class SharedModule {

}
