import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS
  
  // WebSocket is automatically enabled via @WebSocketGateway decorator
  // Socket.io adapter will be automatically instantiated by NestJS
  
  // Increase the size limit for the request body (e.g., 10MB)
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  
  await app.listen(3000, '0.0.0.0'); // Listen on all network interfaces
  console.log('VDerm-X Backend running on http://0.0.0.0:3000');
  console.log('WebSocket server available at ws://localhost:3000');
}
bootstrap();
