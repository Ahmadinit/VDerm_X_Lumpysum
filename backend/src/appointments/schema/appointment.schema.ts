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

  // Enhanced Booking Details
  @Prop({ type: Date, required: true })
  appointmentDate: Date; // Appointment date

  @Prop({ required: true })
  appointmentTime: string; // Format: "14:30" (24-hour format)

  @Prop({ default: 30 })
  duration: number; // Duration in minutes

  @Prop({ 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'], 
    default: 'pending' 
  })
  status: string;

  @Prop({ required: true })
  reason: string; // User's description of the issue

  // Data Sharing Feature
  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      diagnosisId: { type: Types.ObjectId, ref: 'Diagnosis' },
      images: [String],
      analysisText: String,
      notes: String,
      sharedAt: Date,
    },
    default: {},
  })
  dataSharing: {
    enabled?: boolean;
    diagnosisId?: Types.ObjectId;
    images?: string[];
    analysisText?: string;
    notes?: string;
    sharedAt?: Date;
  };

  // Medical Records (Added by vet after appointment)
  @Prop({
    type: {
      notes: String,
      prescription: String,
      medications: [
        {
          name: String,
          dosage: String,
          frequency: String,
          duration: String,
        },
      ],
      followUpDate: Date,
      addedAt: Date,
      addedBy: { type: Types.ObjectId, ref: 'User' },
    },
    default: null,
  })
  medicalRecords?: {
    notes?: string;
    prescription?: string;
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    followUpDate?: Date;
    addedAt?: Date;
    addedBy?: Types.ObjectId;
  };

  // Chat Context
  @Prop({ type: Types.ObjectId, ref: 'AppointmentChat' })
  linkedChatId?: Types.ObjectId;

  // Additional Fields
  @Prop({ required: false })
  imageUrl?: string; // Legacy: optional diagnostic image

  @Prop({ required: false })
  notes?: string; // Legacy: vet's initial notes

  @Prop({ type: Date, required: false })
  confirmedAt?: Date; // When vet confirmed

  @Prop({ required: false })
  rejectionReason?: string; // Reason for rejection

  @Prop({ required: false })
  userNotes?: string; // User's additional notes during booking

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop()
  completionNotes?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
