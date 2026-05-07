import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppointmentChatDocument = AppointmentChat & Document;

@Schema({ collection: 'appointment_chats', timestamps: true })
export class AppointmentChat {
  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: true, unique: true })
  appointmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  vetId: Types.ObjectId;

  // Messages array
  @Prop({
    type: [
      {
        _id: Types.ObjectId,
        senderId: Types.ObjectId,
        senderType: { type: String, enum: ['user', 'vet'] },
        message: String,
        attachments: [String], // URLs to images/files
        timestamp: Date,
        isRead: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
      },
    ],
    default: [],
  })
  messages: Array<{
    _id?: Types.ObjectId;
    senderId: Types.ObjectId;
    senderType: 'user' | 'vet';
    message: string;
    attachments?: string[];
    timestamp: Date;
    isRead?: boolean;
    deletedAt?: Date;
  }>;

  // Shared diagnostic data context
  @Prop({
    type: {
      image: String,
      analysisText: String,
      timestamp: Date,
    },
    default: null,
  })
  sharedDiagnosticData?: {
    image?: string;
    analysisText?: string;
    timestamp?: Date;
  };

  // Typing status (real-time, not persisted long-term)
  @Prop({ default: null })
  lastTypingAt?: Date;

  // Read status tracking
  @Prop({
    type: {
      userId: { type: Boolean, default: false },
      vetId: { type: Boolean, default: false },
    },
    default: {},
  })
  isRead: {
    userId?: boolean;
    vetId?: boolean;
  };

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const AppointmentChatSchema =
  SchemaFactory.createForClass(AppointmentChat);
