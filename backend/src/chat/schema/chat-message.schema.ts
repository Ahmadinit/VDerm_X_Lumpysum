// src/chat/schema/chat-message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ collection: 'chat_messages', timestamps: true })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'ChatConversation', required: true })
  conversationId: Types.ObjectId; // Conversation this message belongs to

  @Prop({ type: String, enum: ['user', 'assistant'], required: true })
  role: string; // 'user' for user messages, 'assistant' for AI responses

  @Prop({ required: true })
  content: string; // Message content

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: Object, required: false })
  metadata?: {
    predictionData?: object; // Store prediction context if relevant
  };
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
