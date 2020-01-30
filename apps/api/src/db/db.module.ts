import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbCollections } from '@aavantan-app/models';
import { userSchema } from './schemas/users.schema';
import { projectSchema } from './schemas/project.schema';
import { organizationSchema } from './schemas/organization.schema';
import { taskSchema } from './schemas/task.schema';
import { taskHistorySchema } from './schemas/task-history.schema';
import { attachmentSchema } from '../attachment/attachment.schema';
import { taskTimeLogSchema } from './schemas/task-time-log.schema';
import { sprintSchema } from './schemas/sprint.schema';
import { invitationSchema } from './schemas/invitations.schema';
import { resetPasswordSchema } from './schemas/reset-password.schema';
import { taskTypeSchema } from './schemas/task-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: DbCollections.users,
      schema: userSchema,
      collection: DbCollections.users
    }, {
      name: DbCollections.projects,
      schema: projectSchema,
      collection: DbCollections.projects
    }, {
      name: DbCollections.organizations,
      schema: organizationSchema,
      collection: DbCollections.organizations
    }, {
      name: DbCollections.tasks,
      schema: taskSchema,
      collection: DbCollections.tasks
    }, {
      name: DbCollections.taskHistory,
      schema: taskHistorySchema,
      collection: DbCollections.taskHistory
    }, {
      name: DbCollections.attachments,
      schema: attachmentSchema,
      collection: DbCollections.attachments
    }, {
      name: DbCollections.taskTimeLog,
      schema: taskTimeLogSchema,
      collection: DbCollections.taskTimeLog
    }, {
      name: DbCollections.sprint,
      schema: sprintSchema,
      collection: DbCollections.sprint
    }, {
      name: DbCollections.invitations,
      schema: invitationSchema,
      collection: DbCollections.invitations
    }, {
      name: DbCollections.resetPassword,
      schema: resetPasswordSchema,
      collection: DbCollections.resetPassword
    }, {
      name: DbCollections.taskType,
      schema: taskTypeSchema,
      collection: DbCollections.taskType
    }])
  ],
  exports: [
    MongooseModule
  ]
})
export class DbModule {

}
