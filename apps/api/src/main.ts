/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 **/

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import { GenericExceptionFilter } from './shared/exceptionFilters/generic.exceptionFilter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const globalPrefix = 'api';
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GenericExceptionFilter());
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.port || 3333;
  await app.listen(port, () => {
    console.log('Listening at http://localhost:' + port + '/' + globalPrefix);
  });
}

bootstrap();
