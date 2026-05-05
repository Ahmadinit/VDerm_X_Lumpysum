// src/user/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'user' })  // Explicitly define collection name here
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ default: '' })
  otp: string;

  @Prop({ type: Date, default: null })
  otpExpiresAt: Date;

  @Prop({ type: Boolean, default: false })
  verified: boolean; // Indicates if the user's email is verified

  @Prop({ type: String, enum: ['user', 'vet'], default: 'user' })
  role: string; // User role: 'user' or 'vet'

  // Vet-specific fields (only used when role = 'vet')
  @Prop({ required: false })
  specialization?: string; // e.g., "Cattle Specialist"

  @Prop({ required: false })
  contact?: string; // Phone number

  @Prop({ required: false })
  area?: string; // Location/service area

  @Prop({ required: false })
  availability?: string; // e.g., "Mon-Fri 9AM-5PM"

  @Prop({ required: false })
  licenseNumber?: string; // Veterinary license number

  @Prop({ required: false })
  profileImage?: string; // Profile image URL

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
