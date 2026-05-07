// src/appointments/services/chat.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppointmentChat, AppointmentChatDocument } from '../schema/appointment-chat.schema';
import { Appointment, AppointmentDocument } from '../schema/appointment.schema';
import { ChatGateway } from '../gateways/chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(AppointmentChat.name) private chatModel: Model<AppointmentChatDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    private chatGateway: ChatGateway,
  ) {}

  /**
   * Get chat history for an appointment
   */
  async getChatHistory(appointmentId: string, userId: string): Promise<AppointmentChat> {
    // Verify user has access to this appointment
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const isParticipant =
      appointment.userId.toString() === userId || appointment.vetId.toString() === userId;
    if (!isParticipant) {
      throw new BadRequestException('You do not have access to this chat');
    }

    // Get chat
    const chat = await this.chatModel
      .findOne({ appointmentId: new Types.ObjectId(appointmentId) })
      .populate('userId', 'username email')
      .populate('vetId', 'username specialization profileImage')
      .exec();

    if (!chat) {
      throw new NotFoundException('Chat not found for this appointment');
    }

    return chat;
  }

  /**
   * Get all messages in a chat
   */
  async getMessages(appointmentId: string, userId: string) {
    const chat = await this.getChatHistory(appointmentId, userId);
    return chat.messages;
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(appointmentId: string, messageId: string, userId: string) {
    const chat = await this.chatModel.findOne({
      appointmentId: new Types.ObjectId(appointmentId),
    });

    if (!chat) {
      throw new NotFoundException('Chat not found for this appointment');
    }

    // Verify user has access
    const isParticipant = chat.userId.toString() === userId || chat.vetId.toString() === userId;
    if (!isParticipant) {
      throw new BadRequestException('You do not have access to this chat');
    }

    const message = chat.messages.find((m) => m._id?.toString() === messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId.toString() !== userId) {
      throw new BadRequestException('You can only delete your own messages');
    }

    // Soft delete (don't remove, just mark)
    message.deletedAt = new Date();
    await chat.save();

    // Emit deletion event
    this.chatGateway.emitToAppointment(appointmentId, 'message_deleted', {
      messageId,
      appointmentId,
      deletedAt: message.deletedAt,
    });

    return { success: true, messageId };
  }

  /**
   * Mark all messages as read for a user
   */
  async markAllAsRead(appointmentId: string, userId: string) {
    const chat = await this.chatModel.findOne({
      appointmentId: new Types.ObjectId(appointmentId),
    });

    if (!chat) {
      throw new NotFoundException('Chat not found for this appointment');
    }

    // Verify user has access
    const isParticipant = chat.userId.toString() === userId || chat.vetId.toString() === userId;
    if (!isParticipant) {
      throw new BadRequestException('You do not have access to this chat');
    }

    // Mark all messages from other user as read
    chat.messages.forEach((msg) => {
      if (msg.senderId.toString() !== userId) {
        msg.isRead = true;
      }
    });

    // Update read status tracking
    if (userId === chat.userId.toString()) {
      chat.isRead.userId = true;
    } else if (userId === chat.vetId.toString()) {
      chat.isRead.vetId = true;
    }

    await chat.save();

    return { success: true, appointmentId };
  }

  /**
   * Get unread message count for appointment
   */
  async getUnreadCount(appointmentId: string, userId: string) {
    const chat = await this.getChatHistory(appointmentId, userId);

    const unreadCount = chat.messages.filter(
      (msg) => msg.senderId.toString() !== userId && !msg.isRead,
    ).length;

    return { appointmentId, unreadCount, total: chat.messages.length };
  }

  /**
   * Get shared diagnostic data in chat
   */
  async getSharedDiagnosticData(appointmentId: string, userId: string) {
    const chat = await this.getChatHistory(appointmentId, userId);
    return chat.sharedDiagnosticData;
  }

  /**
   * Add note to a message (for vet follow-up notes)
   */
  async addMessageNote(appointmentId: string, messageId: string, note: string, userId: string) {
    const chat = await this.chatModel.findOne({
      appointmentId: new Types.ObjectId(appointmentId),
    });

    if (!chat) {
      throw new NotFoundException('Chat not found for this appointment');
    }

    // Verify user has access
    const isParticipant = chat.userId.toString() === userId || chat.vetId.toString() === userId;
    if (!isParticipant) {
      throw new BadRequestException('You do not have access to this chat');
    }

    const message = chat.messages.find((m) => m._id?.toString() === messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // For now, we'll add a system message with the note
    // In a more advanced implementation, you might add metadata to the original message
    const noteMessage = {
      _id: new Types.ObjectId(),
      senderId: new Types.ObjectId(userId),
      senderType: 'vet' as const,
      message: `📝 Note on message: ${note}`,
      attachments: [],
      timestamp: new Date(),
      isRead: false,
      deletedAt: null,
    };

    chat.messages.push(noteMessage);
    await chat.save();

    // Emit note event
    this.chatGateway.emitToAppointment(appointmentId, 'message_noted', {
      originalMessageId: messageId,
      noteMessage,
    });

    return noteMessage;
  }

  /**
   * Search messages in a chat
   */
  async searchMessages(appointmentId: string, userId: string, query: string) {
    const chat = await this.getChatHistory(appointmentId, userId);

    const results = chat.messages.filter(
      (msg) => !msg.deletedAt && msg.message.toLowerCase().includes(query.toLowerCase()),
    );

    return {
      appointmentId,
      query,
      count: results.length,
      messages: results,
    };
  }

  /**
   * Export chat as text
   */
  async exportChat(appointmentId: string, userId: string): Promise<string> {
    const chat = await this.getChatHistory(appointmentId, userId);

    let exportText = `Chat Export for Appointment ${appointmentId}\n`;
    exportText += `Started: ${chat.createdAt.toISOString()}\n`;
    exportText += `Last Updated: ${chat.updatedAt.toISOString()}\n`;
    exportText += `\n${'='.repeat(50)}\n\n`;

    for (const msg of chat.messages) {
      if (msg.deletedAt) continue; // Skip deleted messages

      const sender = msg.senderType === 'vet' ? 'Vet' : 'User';
      const timestamp = msg.timestamp.toISOString();
      exportText += `[${timestamp}] ${sender}: ${msg.message}\n`;

      if (msg.attachments?.length) {
        exportText += `  Attachments: ${msg.attachments.join(', ')}\n`;
      }
    }

    if (chat.sharedDiagnosticData) {
      exportText += `\n${'='.repeat(50)}\nShared Diagnostic Data\n`;
      exportText += `Timestamp: ${chat.sharedDiagnosticData.timestamp?.toISOString()}\n`;
      exportText += `Analysis: ${chat.sharedDiagnosticData.analysisText}\n`;
      if (chat.sharedDiagnosticData.image) {
        exportText += `Image: ${chat.sharedDiagnosticData.image}\n`;
      }
    }

    return exportText;
  }
}
