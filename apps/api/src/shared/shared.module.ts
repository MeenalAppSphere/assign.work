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

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{
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
    }])
  ],
  exports: [
    MongooseModule,
    UsersService,
    ProjectService,
    OrganizationService,
    TaskService,
    TaskHistoryService
  ],
  providers: [
    UsersService,
    ProjectService,
    OrganizationService,
    TaskService,
    TaskHistoryService
  ]
})
export class SharedModule {

}
