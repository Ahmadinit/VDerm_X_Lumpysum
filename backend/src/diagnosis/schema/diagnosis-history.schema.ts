// src/diagnosis/schema/diagnosis-history.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DiagnosisHistoryDocument = DiagnosisHistory & Document;

@Schema({ collection: 'diagnosis_history', timestamps: true })
export class DiagnosisHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // User who submitted the diagnosis

  @Prop({ required: true })
  imageUrl: string; // Path or URL to the uploaded image

  @Prop({ type: Object, required: true })
  prediction: {
    classification: string; // "Lumpy Skin" or "Not Lumpy Skin"
    confidence: number[]; // [lumpy_probability, not_lumpy_probability]
  };

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ required: false })
  location?: string; // Optional: for tracking disease spread

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const DiagnosisHistorySchema = SchemaFactory.createForClass(DiagnosisHistory);
