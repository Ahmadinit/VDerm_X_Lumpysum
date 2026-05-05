// src/chat/chat.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Headers,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatConversation } from './schema/chat-conversation.schema';
import { ChatMessage } from './schema/chat-message.schema';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  async createConversation(
    @Headers('x-user-id') userId: string,
    @Body('diagnosisId') diagnosisId?: string,
    @Body('title') title?: string,
  ): Promise<ChatConversation> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required in headers');
    }

    return this.chatService.createConversation(userId, diagnosisId, title);
  }

  @Get('conversations/:userId')
  async getUserConversations(
    @Param('userId') userId: string,
  ): Promise<ChatConversation[]> {
    return this.chatService.getUserConversations(userId);
  }

  @Post('message')
  async sendMessage(
    @Headers('x-user-id') userId: string,
    @Body('conversationId') conversationId: string,
    @Body('content') content: string,
  ): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required in headers');
    }

    if (!conversationId || !content) {
      throw new BadRequestException('conversationId and content are required');
    }

    return this.chatService.sendMessage(userId, conversationId, content);
  }

  @Get('messages/:conversationId')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
  ): Promise<ChatMessage[]> {
    return this.chatService.getConversationMessages(conversationId);
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    await this.chatService.deleteConversation(id, userId);
    return { message: 'Conversation deleted successfully' };
  }
}
