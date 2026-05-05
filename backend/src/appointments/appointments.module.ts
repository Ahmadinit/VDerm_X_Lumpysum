// src/appointments/appointments.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentSchema } from './schema/appointment.schema';
import { VetAvailability, VetAvailabilitySchema } from './schema/vet-availability.schema';
import { AppointmentChat, AppointmentChatSchema } from './schema/appointment-chat.schema';
import { User, UserSchema } from '../user/schema/user.schema';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: VetAvailability.name, schema: VetAvailabilitySchema },
      { name: AppointmentChat.name, schema: AppointmentChatSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AppointmentsController, ChatController],
  providers: [AppointmentsService, ChatGateway, ChatService],
  exports: [AppointmentsService, ChatService],
})
export class AppointmentsModule {}
