// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatConversation, ChatConversationSchema } from './schema/chat-conversation.schema';
import { ChatMessage, ChatMessageSchema } from './schema/chat-message.schema';
import { DiagnosisHistory, DiagnosisHistorySchema } from '../diagnosis/schema/diagnosis-history.schema';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatConversation.name, schema: ChatConversationSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: DiagnosisHistory.name, schema: DiagnosisHistorySchema },
    ]),
    AiModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
