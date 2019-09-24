import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbNameEnum } from '@aavantan-app/models';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{
      name: DbNameEnum.users,
      schema: null,
      collection: DbNameEnum.users,
    }]),
  ],
  exports: [],
  providers: [],
})
export class SharedModule {

}
