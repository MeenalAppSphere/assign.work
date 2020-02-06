import { Module } from '@nestjs/common';

import { SharedModule } from '../shared/shared.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProjectModule } from '../project/project.module';
import { OrganizationModule } from '../organization/organization.module';
import { TaskModule } from '../task/task.module';
import { AttachmentModule } from '../attachment/attachment.module';
import { TaskHistoryModule } from '../task-history/task-history.module';
import { TaskTimeLogModule } from '../task-time-log/task-time-log.module';
import { SprintModule } from '../sprint/sprint.module';
import * as aws from 'aws-sdk';
import { InvitationsModule } from '../invitations/invitations.module';
import { PublicModule } from '../public/public.module';
import { TaskStatusModule } from '../task-status/task-status.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { TaskPriorityModule } from '../task-priority/task-priority.module';
import { TaskTypeModule } from '../task-type/task-type.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://user1:user123@cluster0-i2eid.mongodb.net/test?retryWrites=true&w=majority',
      { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }),
    SharedModule,
    AuthModule,
    UsersModule,
    ProjectModule,
    OrganizationModule,
    TaskModule,
    TaskHistoryModule,
    AttachmentModule,
    TaskTimeLogModule,
    SprintModule,
    InvitationsModule,
    PublicModule,
    TaskStatusModule,
    TaskPriorityModule,
    TaskTypeModule,
    WorkflowModule
  ],
  controllers: []
})
export class AppModule {

  constructor() {
    aws.config.update({
      region: 'ap-south-1',
      accessKeyId: process.env.AWS_ACCESSKEYID,
      secretAccessKey: process.env.AWS_SECRETACCESSKEY
    });
  }

}
