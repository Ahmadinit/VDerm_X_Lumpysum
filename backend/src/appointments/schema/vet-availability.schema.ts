import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VetAvailabilityDocument = VetAvailability & Document;

@Schema({ collection: 'vet_availabilities', timestamps: true })
export class VetAvailability {
  @Prop({ type: Types.ObjectId, ref: 'Vet', required: true, unique: true })
  vetId: Types.ObjectId;

  // Weekly recurring schedule
  @Prop({
    type: {
      monday: {
        isAvailable: { type: Boolean, default: true },
        startTime: { type: String, default: '09:00' }, // 24-hour format
        endTime: { type: String, default: '17:00' },
      },
      tuesday: {
        isAvailable: { type: Boolean, default: true },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' },
      },
      wednesday: {
        isAvailable: { type: Boolean, default: true },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' },
      },
      thursday: {
        isAvailable: { type: Boolean, default: true },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' },
      },
      friday: {
        isAvailable: { type: Boolean, default: true },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' },
      },
      saturday: {
        isAvailable: { type: Boolean, default: false },
        startTime: { type: String, default: '10:00' },
        endTime: { type: String, default: '14:00' },
      },
      sunday: {
        isAvailable: { type: Boolean, default: false },
        startTime: { type: String, default: '' },
        endTime: { type: String, default: '' },
      },
    },
    default: {},
  })
  weeklySchedule: {
    [key: string]: {
      isAvailable: boolean;
      startTime: string;
      endTime: string;
    };
  };

  // Appointment duration in minutes (for slot calculation)
  @Prop({ default: 30 })
  appointmentDuration: number;

  // Break times and holidays
  @Prop({
    type: [
      {
        date: Date,
        startTime: String,
        endTime: String,
        reason: String,
      },
    ],
    default: [],
  })
  breaks: Array<{
    date: Date;
    startTime: string;
    endTime: string;
    reason: string;
  }>;

  // Holidays (full day off)
  @Prop({
    type: [
      {
        date: Date,
        reason: String,
      },
    ],
    default: [],
  })
  holidays: Array<{
    date: Date;
    reason: string;
  }>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const VetAvailabilitySchema = SchemaFactory.createForClass(
  VetAvailability,
);
