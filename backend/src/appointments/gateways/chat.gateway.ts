// src/appointments/gateways/chat.gateway.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppointmentChat, AppointmentChatDocument } from '../schema/appointment-chat.schema';
import { Appointment, AppointmentDocument } from '../schema/appointment.schema';

// Type definitions for Socket.io (no import needed, types only)
type Socket = any;
type Server = any;

interface AuthSocket {
  userId?: string;
  userRole?: string;
  handshake?: any;
  id?: string;
  join?: (room: string) => void;
  leave?: (room: string) => void;
  emit?: (event: string, data: any) => void;
  disconnect?: () => void;
}

// Decorators - create simple no-op versions if not available
const WebSocketGateway = (config?: any) => (target: any) => target;
const SubscribeMessage = (event: string) => (target: any, propertyKey: string, descriptor: any) => descriptor;
const MessageBody = () => (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {};
const ConnectedSocket = () => (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {};

interface OnGatewayConnection {
  handleConnection(client: AuthSocket): any;
}

interface OnGatewayDisconnect {
  handleDisconnect(client: AuthSocket): any;
}

class WsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WsException';
  }
}

@WebSocketGateway({
  cors: {
    origin: ['*'], // Allow all origins in development; restrict in production
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private server: Server;
  // Track connected users: key = userId, value = Set of socket IDs
  private connectedUsers = new Map<string, Set<string>>();

  constructor(
    @InjectModel(AppointmentChat.name) private appointmentChatModel: Model<AppointmentChatDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
  ) {}

  afterInit(server: Server) {
    this.server = server;
  }

  handleConnection(client: AuthSocket) {
    // Extract userId from query parameters
    const userId = client.handshake.query.userId as string;
    const userRole = client.handshake.query.userRole as string;

    if (!userId) {
      client.disconnect();
      throw new WsException('Missing userId in connection');
    }

    client.userId = userId;
    client.userRole = userRole || 'user';

    // Track connected user
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(client.id);

    console.log(`User ${userId} connected. Total sockets: ${this.connectedUsers.get(userId)!.size}`);
  }

  handleDisconnect(client: AuthSocket) {
    const userId = client.userId;

    if (userId) {
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }
      console.log(`User ${userId} disconnected`);
    }
  }

  /**
   * Join appointment chat room
   * Client sends: { appointmentId }
   */
  @SubscribeMessage('join_appointment')
  async handleJoinAppointment(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { appointmentId: string },
  ) {
    const { appointmentId } = data;
    const userId = client.userId;

    if (!appointmentId || !userId) {
      throw new WsException('Missing appointmentId or userId');
    }

    // Verify user has access to this appointment
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) {
      throw new WsException('Appointment not found');
    }

    const isParticipant =
      appointment.userId.toString() === userId || appointment.vetId.toString() === userId;
    if (!isParticipant) {
      throw new WsException('Unauthorized: You are not part of this appointment');
    }

    // Join room named after appointment ID
    const roomName = `appointment_${appointmentId}`;
    client.join(roomName);

    // Get chat history
    const chat = await this.appointmentChatModel.findOne({ appointmentId: new Types.ObjectId(appointmentId) });

    // Emit chat history to this client
    if (chat) {
      client.emit('chat_history', {
        messages: chat.messages,
        sharedDiagnosticData: chat.sharedDiagnosticData,
      });
    }

    // Notify others in room that user joined
    this.server.to(roomName).emit('user_joined', {
      userId,
      userRole: client.userRole,
      timestamp: new Date(),
    });

    client.emit('joined_appointment', { appointmentId, roomName });
  }

  /**
   * Leave appointment chat room
   * Client sends: { appointmentId }
   */
  @SubscribeMessage('leave_appointment')
  handleLeaveAppointment(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { appointmentId: string },
  ) {
    const { appointmentId } = data;
    const userId = client.userId;

    const roomName = `appointment_${appointmentId}`;
    client.leave(roomName);

    this.server.to(roomName).emit('user_left', {
      userId,
      timestamp: new Date(),
    });
  }

  /**
   * Send message in appointment chat
   * Client sends: { appointmentId, message, attachments? }
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: {
      appointmentId: string;
      message: string;
      attachments?: string[];
    },
  ) {
    const { appointmentId, message, attachments } = data;
    const userId = client.userId;

    if (!appointmentId || !message || !userId) {
      throw new WsException('Missing required fields: appointmentId, message, or userId');
    }

    try {
      // Find and update chat
      const chat = await this.appointmentChatModel.findOne({
        appointmentId: new Types.ObjectId(appointmentId),
      });

      if (!chat) {
        throw new WsException('Chat not found for this appointment');
      }

      // Add message to database
      const messageId = new Types.ObjectId();
      const messageData = {
        _id: messageId,
        senderId: new Types.ObjectId(userId),
        senderType: (client.userRole === 'vet' ? 'vet' : 'user') as 'user' | 'vet',
        message,
        attachments: attachments || [],
        timestamp: new Date(),
        isRead: false,
        deletedAt: null,
      };

      chat.messages.push(messageData);
      chat.updatedAt = new Date();
      await chat.save();

      // Broadcast message to room
      const roomName = `appointment_${appointmentId}`;
      this.server.to(roomName).emit('new_message', {
        ...messageData,
        appointmentId,
      });

      // Send confirmation to sender
      client.emit('message_sent', {
        messageId: messageId.toString(),
        appointmentId,
        status: 'sent',
      });
    } catch (error) {
      throw new WsException(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Mark message as read
   * Client sends: { appointmentId, messageId }
   */
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: {
      appointmentId: string;
      messageId: string;
    },
  ) {
    const { appointmentId, messageId } = data;
    const userId = client.userId;

    try {
      const chat = await this.appointmentChatModel.findOne({
        appointmentId: new Types.ObjectId(appointmentId),
      });

      if (!chat) {
        throw new WsException('Chat not found');
      }

      // Find and mark message as read
      const message = chat.messages.find((m) => m._id?.toString() === messageId);
      if (message) {
        message.isRead = true;
      }

      await chat.save();

      // Broadcast read status to room
      const roomName = `appointment_${appointmentId}`;
      this.server.to(roomName).emit('message_read', {
        messageId,
        readBy: userId,
        timestamp: new Date(),
      });
    } catch (error) {
      throw new WsException(`Failed to mark message as read: ${error.message}`);
    }
  }

  /**
   * Share diagnostic data in appointment chat
   * Client sends: { appointmentId, image, analysisText }
   */
  @SubscribeMessage('share_diagnostic')
  async handleShareDiagnostic(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: {
      appointmentId: string;
      image?: string;
      analysisText?: string;
    },
  ) {
    const { appointmentId, image, analysisText } = data;

    try {
      const chat = await this.appointmentChatModel.findOne({
        appointmentId: new Types.ObjectId(appointmentId),
      });

      if (!chat) {
        throw new WsException('Chat not found');
      }

      // Store shared diagnostic data
      chat.sharedDiagnosticData = {
        image,
        analysisText,
        timestamp: new Date(),
      };

      await chat.save();

      // Broadcast shared data to room
      const roomName = `appointment_${appointmentId}`;
      this.server.to(roomName).emit('diagnostic_shared', {
        appointmentId,
        sharedData: chat.sharedDiagnosticData,
        sharedBy: client.userId,
      });
    } catch (error) {
      throw new WsException(`Failed to share diagnostic data: ${error.message}`);
    }
  }

  /**
   * Typing indicator
   * Client sends: { appointmentId, isTyping }
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: {
      appointmentId: string;
      isTyping: boolean;
    },
  ) {
    const { appointmentId, isTyping } = data;

    if (!appointmentId) {
      throw new WsException('Missing appointmentId');
    }

    const roomName = `appointment_${appointmentId}`;
    this.server.to(roomName).emit('user_typing', {
      userId: client.userId,
      userRole: client.userRole,
      isTyping,
      timestamp: new Date(),
    });
  }

  /**
   * Check if user is online for an appointment
   * Returns list of online participants
   */
  @SubscribeMessage('check_online')
  async handleCheckOnline(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: {
      appointmentId: string;
    },
  ) {
    const { appointmentId } = data;
    const roomName = `appointment_${appointmentId}`;
    const roomClients = this.server.sockets.adapter.rooms.get(roomName);

    const onlineUsers = Array.from(roomClients || []).map((socketId) => {
      const socket = this.server.sockets.sockets.get(socketId) as AuthSocket;
      return {
        userId: socket?.userId,
        userRole: socket?.userRole,
      };
    });

    client.emit('online_users', {
      appointmentId,
      onlineUsers,
    });
  }

  /**
   * Helper to get socket server (for external calls)
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * Helper to emit to appointment room from service
   */
  emitToAppointment(appointmentId: string, event: string, data: any) {
    const roomName = `appointment_${appointmentId}`;
    this.server.to(roomName).emit(event, data);
  }
}
