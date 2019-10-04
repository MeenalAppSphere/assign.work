import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbCollection } from '@aavantan-app/models';
import { userSchema } from '../users/users.schema';
import { projectSchema } from '../project/project.schema';

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
    }])
  ],
  exports: [
    MongooseModule
  ],
  providers: []
})
export class SharedModule {

}
