// src/vets/schema/vet.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VetDocument = Vet & Document;

@Schema({ collection: 'vets', timestamps: true })
export class Vet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId; // Link to User (authentication)

  // Profile Information
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: [String], default: [] })
  specializations: string[]; // e.g., ['Dermatology', 'Surgery']

  @Prop({ required: false })
  licenseNumber: string;

  @Prop({ required: false })
  clinicName: string;

  @Prop({ required: false })
  bio: string;

  @Prop({ required: false })
  profileImage: string;

  // Ratings & Reviews
  @Prop({ default: 0 })
  averageRating: number; // 1-5 stars

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({
    type: [
      {
        userId: Types.ObjectId,
        appointmentId: Types.ObjectId,
        rating: Number,
        comment: String,
        date: Date,
      },
    ],
    default: [],
  })
  reviews: Array<{
    userId: Types.ObjectId;
    appointmentId: Types.ObjectId;
    rating: number;
    comment: string;
    date: Date;
  }>;

  // Contact Information
  @Prop({ required: false })
  phone: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: false })
  clinicAddress: string;

  @Prop({ required: false })
  clinicCity: string;

  @Prop({ required: false })
  clinicState: string;

  @Prop({ required: false })
  clinicZipCode: string;

  @Prop({ required: false })
  website: string;

  // Availability Status
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: 0 })
  responseTime: number; // average response time in minutes

  @Prop({ default: 0 })
  appointmentsThisMonth: number;

  // Legacy Fields
  @Prop({ required: false })
  specialization: string;

  @Prop({ required: false })
  contact: string;

  @Prop({ required: false })
  area: string;

  @Prop({ required: false })
  availability: string;

  @Prop({ required: false })
  imageUrl: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const VetSchema = SchemaFactory.createForClass(Vet);

