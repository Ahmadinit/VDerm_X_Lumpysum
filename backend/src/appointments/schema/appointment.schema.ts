// src/appointments/schema/appointment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

@Schema({ collection: 'appointments', timestamps: true })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // User who booked the appointment

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  vetId: Types.ObjectId; // Vet for the appointment

  @Prop({ type: Date, required: true })
  date: Date; // Appointment date

  @Prop({ required: true })
  timeSlot: string; // e.g., "10:00 AM - 11:00 AM"

  @Prop({ 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'], 
    default: 'pending' 
  })
  status: string;

  @Prop({ required: true })
  reason: string; // User's description of the issue

  @Prop({ required: false })
  notes?: string; // Vet's notes after reviewing

  @Prop({ required: false })
  imageUrl?: string; // Optional image uploaded with appointment

  @Prop({ type: Date, required: false })
  confirmedAt?: Date; // When vet confirmed

  @Prop({ required: false })
  rejectedReason?: string; // Reason for rejection

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
