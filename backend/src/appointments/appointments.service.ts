// src/appointments/appointments.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument } from './schema/appointment.schema';
import { User, UserDocument } from '../user/schema/user.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createAppointment(
    userId: string,
    vetId: string,
    date: Date,
    timeSlot: string,
    reason: string,
    imageUrl?: string,
  ): Promise<Appointment> {
    // Verify vet exists and has role 'vet'
    const vet = await this.userModel.findById(vetId);
    if (!vet || vet.role !== 'vet') {
      throw new BadRequestException('Invalid vet ID');
    }

    // Verify user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('Invalid user ID');
    }

    const appointment = new this.appointmentModel({
      userId: new Types.ObjectId(userId),
      vetId: new Types.ObjectId(vetId),
      date,
      timeSlot,
      reason,
      imageUrl,
      status: 'pending',
    });

    return appointment.save();
  }

  async getUserAppointments(userId: string): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('vetId', 'username email specialization contact area')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getVetAppointments(vetId: string): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ vetId: new Types.ObjectId(vetId) })
      .populate('userId', 'username email contact')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate('userId', 'username email contact')
      .populate('vetId', 'username email specialization contact area')
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async updateAppointmentStatus(
    id: string,
    status: string,
    notes?: string,
    rejectedReason?: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    appointment.status = status;
    appointment.updatedAt = new Date();

    if (notes) {
      appointment.notes = notes;
    }

    if (status === 'confirmed') {
      appointment.confirmedAt = new Date();
    }

    if (status === 'rejected' && rejectedReason) {
      appointment.rejectedReason = rejectedReason;
    }

    return appointment.save();
  }

  async cancelAppointment(id: string, userId: string): Promise<void> {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify ownership
    if (appointment.userId.toString() !== userId) {
      throw new BadRequestException('You can only cancel your own appointments');
    }

    // Only allow cancellation if not completed
    if (appointment.status === 'completed') {
      throw new BadRequestException('Cannot cancel completed appointments');
    }

    appointment.status = 'cancelled';
    appointment.updatedAt = new Date();
    await appointment.save();
  }
}
