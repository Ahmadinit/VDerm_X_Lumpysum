// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ImageModule } from './model/image.module';
import { ImageModulee } from './image/image.module';
import { VetModule } from './vet/vets.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { ChatModule } from './chat/chat.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (
  !mongoUri ||
  mongoUri.includes('cluster0.xxxxx.mongodb.net') ||
  mongoUri.includes('username:password@')
) {
  throw new Error(
    'Invalid MONGODB_URI in backend/.env. Replace template values with your real MongoDB Atlas connection string.',
  );
}


@Module({
  imports: [
    // Connect to MongoDB
    MongooseModule.forRoot(mongoUri),
    UserModule,
    //ImageModule,
    ImageModulee,
    VetModule,
    AppointmentsModule,
    DiagnosisModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
