import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    AuthModule,
    SharedModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
