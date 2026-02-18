import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS
   // Increase the size limit for the request body (e.g., 10MB)
   app.use(bodyParser.json({ limit: '10mb' }));
   app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
   await app.listen(3000, '0.0.0.0'); // Listen on all network interfaces
}
bootstrap();
