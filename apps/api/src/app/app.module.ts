import { Module } from '@nestjs/common';

import { SharedModule } from '../shared/shared.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProjectModule } from '../project/project.module';
import { OrganizationModule } from '../organization/organization.module';
import { TaskModule } from '../task/task.module';
import { AttachmentModule } from '../attachment/attachment.module';
import { ConfigModule } from 'nestjs-config';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.load(path.resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
    MongooseModule.forRoot('mongodb://appsphere:use588mead@cluster0-shard-00-00-fdpyz.mongodb.net:27017,cluster0-shard-00-01-fdpyz.mongodb.net:27017,cluster0-shard-00-02-fdpyz.mongodb.net:27017/AavantanCADB?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority'),
    SharedModule,
    AuthModule,
    UsersModule,
    ProjectModule,
    OrganizationModule,
    TaskModule,
    AttachmentModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {
}
