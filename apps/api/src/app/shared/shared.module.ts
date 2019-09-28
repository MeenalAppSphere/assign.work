import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbCollection } from '@aavantan-app/models';
import { userSchema } from '../schemas/users.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{
      name: DbCollection.users,
      schema: userSchema,
      collection: DbCollection.users
    }])
  ],
  exports: [
    MongooseModule
  ],
  providers: []
})
export class SharedModule {

}
