import { Global, Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { ProjectService } from './services/project.service';
import { OrganizationService } from './services/organization.service';
import { TaskService } from './services/task.service';
import { TaskHistoryService } from './services/task-history.service';
import { AttachmentService } from './services/attachment.service';
import { EasyconfigModule } from 'nestjs-easyconfig';
import * as path from 'path';
import { GeneralService } from './services/general.service';
import { TaskTimeLogService } from './services/task-time-log.service';
import { SprintService } from './services/sprint/sprint.service';
import { InvitationService } from './services/invitation.service';
import { EmailService } from './services/email.service';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { DbModule } from '../db/db.module';
import { ResetPasswordService } from './services/reset-password/reset-password.service';
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
  InvitationService,
  EmailService,
  ResetPasswordService,
  TaskTypeService
];

@Global()
@Module({
  imports: [
    EasyconfigModule.register({ path: path.resolve(__dirname, '.env') }),
    WinstonModule.forRoot({
      level: 'error',
      transports: [
        new winston.transports.File({
          format: winston.format.combine(
            winston.format.timestamp()
          ),
          filename: 'error.log'
        })

      ]
    }),
    DbModule
  ],
  exports: [
    DbModule,
    WinstonModule,
    ...providers
  ],
  providers: [
    ...providers
  ]
})
export class SharedModule {

}
