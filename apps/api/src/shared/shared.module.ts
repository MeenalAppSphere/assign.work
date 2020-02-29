import { Global, Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { ProjectService } from './services/project/project.service';
import { OrganizationService } from './services/organization.service';
import { TaskService } from './services/task/task.service';
import { TaskHistoryService } from './services/task-history.service';
import { AttachmentService } from './services/attachment.service';
import { EasyconfigModule } from 'nestjs-easyconfig';
import * as path from 'path';
import { GeneralService } from './services/general.service';
import { TaskTimeLogService } from './services/task-time-log/task-time-log.service';
import { SprintService } from './services/sprint/sprint.service';
import { InvitationService } from './services/invitation.service';
import { EmailService } from './services/email.service';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { DbModule } from '../db/db.module';
import { ResetPasswordService } from './services/reset-password/reset-password.service';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { resolvePathHelper } from './helpers/helpers';
import { GenericExceptionFilter } from './exceptionFilters/generic.exceptionFilter';
import { WorkflowService } from './services/workflow/workflow.service';
import { TaskStatusService } from './services/task-status/task-status.service';
import { TaskPriorityService } from './services/task-priority/task-priority.service';
import { TaskTypeService } from './services/task-type/task-type.service';
import { BoardService } from './services/board/board.service';
import { TaskCommentService } from './services/task-comment/task-comment.service';

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
  WorkflowService,
  TaskStatusService,
  TaskPriorityService,
  TaskTypeService,
  BoardService,
  TaskCommentService
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
            winston.format.timestamp(),
            winston.format.prettyPrint()
          ),
          filename: resolvePathHelper('error.log')
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
    ...providers,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor
    },
    {
      provide: APP_FILTER,
      useClass: GenericExceptionFilter
    }
  ]
})
export class SharedModule {

}
