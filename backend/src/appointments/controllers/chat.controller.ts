// src/appointments/controllers/chat.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatService } from '../services/chat.service';

@Controller('appointments/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get full chat history for an appointment
   * GET /appointments/chat/:appointmentId
   */
  @Get(':appointmentId')
  async getChatHistory(
    @Param('appointmentId') appointmentId: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.chatService.getChatHistory(appointmentId, userId);
  }

  /**
   * Get messages only (not full chat object)
   * GET /appointments/chat/:appointmentId/messages
   */
  @Get(':appointmentId/messages')
  async getMessages(
    @Param('appointmentId') appointmentId: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.chatService.getMessages(appointmentId, userId);
  }

  /**
   * Get shared diagnostic data in chat
   * GET /appointments/chat/:appointmentId/diagnostic
   */
  @Get(':appointmentId/diagnostic')
  async getSharedDiagnostic(
    @Param('appointmentId') appointmentId: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.chatService.getSharedDiagnosticData(appointmentId, userId);
  }

  /**
   * Get unread message count
   * GET /appointments/chat/:appointmentId/unread
   */
  @Get(':appointmentId/unread')
  async getUnreadCount(
    @Param('appointmentId') appointmentId: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.chatService.getUnreadCount(appointmentId, userId);
  }

  /**
   * Mark all messages as read
   * POST /appointments/chat/:appointmentId/mark-read
   */
  @Post(':appointmentId/mark-read')
  async markAllAsRead(
    @Param('appointmentId') appointmentId: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.chatService.markAllAsRead(appointmentId, userId);
  }

  /**
   * Delete a message (soft delete)
   * DELETE /appointments/chat/:appointmentId/messages/:messageId
   */
  @Delete(':appointmentId/messages/:messageId')
  async deleteMessage(
    @Param('appointmentId') appointmentId: string,
    @Param('messageId') messageId: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.chatService.deleteMessage(appointmentId, messageId, userId);
  }

  /**
   * Add vet note to a message
   * POST /appointments/chat/:appointmentId/messages/:messageId/note
   */
  @Post(':appointmentId/messages/:messageId/note')
  async addMessageNote(
    @Param('appointmentId') appointmentId: string,
    @Param('messageId') messageId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Body('note') note: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    if (userRole !== 'vet') {
      throw new UnauthorizedException('Only vets can add notes to messages');
    }

    if (!note) {
      throw new BadRequestException('Note text is required');
    }

    return this.chatService.addMessageNote(appointmentId, messageId, note, userId);
  }

  /**
   * Search messages in a chat
   * GET /appointments/chat/:appointmentId/search?q=query
   */
  @Get(':appointmentId/search')
  async searchMessages(
    @Param('appointmentId') appointmentId: string,
    @Headers('x-user-id') userId: string,
    @Body('q') query?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    if (!query) {
      throw new BadRequestException('Search query (q) is required');
    }

    return this.chatService.searchMessages(appointmentId, userId, query);
  }

  /**
   * Export chat as text file
   * GET /appointments/chat/:appointmentId/export
   */
  @Get(':appointmentId/export')
  async exportChat(
    @Param('appointmentId') appointmentId: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    const chatText = await this.chatService.exportChat(appointmentId, userId);
    return {
      appointmentId,
      export: chatText,
      format: 'text/plain',
    };
  }
}
