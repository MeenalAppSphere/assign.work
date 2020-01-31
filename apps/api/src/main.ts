/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 **/

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);

  const swaggerOptions  = new DocumentBuilder()
    .setTitle('Assign Dot Work')
    .setDescription('Assign Dot Work Api Description')
    .setVersion('0')
    .addTag('Assign Work')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('api', app, document);

  const port = process.env.port || 3000;
  await app.listen(port, () => {
    console.log('Listening at http://localhost:' + port + '/' + globalPrefix);
  });
}

bootstrap();
