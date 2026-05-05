// src/chat/schema/chat-conversation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatConversationDocument = ChatConversation & Document;

@Schema({ collection: 'chat_conversations', timestamps: true })
export class ChatConversation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // User who started the conversation

  @Prop({ type: Types.ObjectId, ref: 'DiagnosisHistory', required: false })
  diagnosisId?: Types.ObjectId; // Linked diagnosis (if chat started from diagnosis)

  @Prop({ required: true })
  title: string; // Auto-generated title, e.g., "Chat about Lumpy Skin - Jan 18"

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ChatConversationSchema = SchemaFactory.createForClass(ChatConversation);
