import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';

@Module({
  imports: [],
  providers: [],
  controllers: [PublicController],
  exports: []
})
export class PublicModule {

}
