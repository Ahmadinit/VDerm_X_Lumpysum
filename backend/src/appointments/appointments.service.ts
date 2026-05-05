// src/appointments/appointments.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument } from './schema/appointment.schema';
import { VetAvailability, VetAvailabilityDocument } from './schema/vet-availability.schema';
import { AppointmentChat, AppointmentChatDocument } from './schema/appointment-chat.schema';
import { User, UserDocument } from '../user/schema/user.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(VetAvailability.name) private vetAvailabilityModel: Model<VetAvailabilityDocument>,
    @InjectModel(AppointmentChat.name) private appointmentChatModel: Model<AppointmentChatDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Get available time slots for a vet on a specific date
   * This includes conflict resolution - checks booked appointments
   */
  async getAvailableSlots(
    vetId: string,
    date: Date,
    duration: number = 30,
  ): Promise<string[]> {
    const vet = await this.userModel.findById(vetId);
    if (!vet || vet.role !== 'vet') {
      throw new BadRequestException('Invalid vet ID');
    }

    // Get vet availability settings
    const availability = await this.vetAvailabilityModel.findOne({ vetId: new Types.ObjectId(vetId) });
    if (!availability) {
      throw new NotFoundException('Vet availability not configured');
    }

    // Check if date is a holiday
    const dateStr = date.toISOString().split('T')[0];
    const isHoliday = availability.holidays?.some(
      (h) => h.date.toISOString().split('T')[0] === dateStr,
    );
    if (isHoliday) {
      return [];
    }

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      date.getDay()
    ];
    const daySchedule = availability.weeklySchedule[dayName];

    if (!daySchedule || !daySchedule.isAvailable) {
      return [];
    }

    // Get booked appointments for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await this.appointmentModel.find({
      vetId: new Types.ObjectId(vetId),
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'completed'] },
    });

    // Generate available slots
    const slots: string[] = [];
    const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
    const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    for (let time = startMinutes; time + duration <= endMinutes; time += duration) {
      const hours = Math.floor(time / 60);
      const mins = time % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      // Check if this slot conflicts with booked appointments
      const isBooked = bookedAppointments.some((apt) => {
        const [aptHour, aptMin] = apt.appointmentTime.split(':').map(Number);
        const aptStart = aptHour * 60 + aptMin;
        const aptEnd = aptStart + apt.duration;
        const slotEnd = time + duration;

        return !(slotEnd <= aptStart || time >= aptEnd); // Conflict if overlaps
      });

      // Check for breaks
      const hasBreak = availability.breaks?.some((brk) => {
        const breakDate = brk.date.toISOString().split('T')[0];
        if (breakDate !== dateStr) return false;

        const [breakStartHour, breakStartMin] = brk.startTime.split(':').map(Number);
        const [breakEndHour, breakEndMin] = brk.endTime.split(':').map(Number);
        const breakStart = breakStartHour * 60 + breakStartMin;
        const breakEnd = breakEndHour * 60 + breakEndMin;

        return !(time + duration <= breakStart || time >= breakEnd);
      });

      if (!isBooked && !hasBreak) {
        slots.push(timeStr);
      }
    }

    return slots;
  }

  /**
   * Create new appointment with data sharing option
   */
  async createAppointment(
    userId: string,
    vetId: string,
    appointmentDate: Date,
    appointmentTime: string,
    reason: string,
    userNotes?: string,
    dataSharing?: {
      enabled: boolean;
      diagnosisId?: string;
      images?: string[];
      analysisText?: string;
      notes?: string;
    },
  ): Promise<Appointment> {
    // Verify vet exists
    const vet = await this.userModel.findById(vetId);
    if (!vet || vet.role !== 'vet') {
      throw new BadRequestException('Invalid vet ID');
    }

    // Verify user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('Invalid user ID');
    }

    // Check for conflicts (conflict resolution)
    const conflictingAppointments = await this.appointmentModel.findOne({
      vetId: new Types.ObjectId(vetId),
      appointmentDate,
      appointmentTime,
      status: { $in: ['confirmed', 'completed'] },
    });

    if (conflictingAppointments) {
      throw new BadRequestException('This time slot is already booked');
    }

    const appointment = new this.appointmentModel({
      userId: new Types.ObjectId(userId),
      vetId: new Types.ObjectId(vetId),
      appointmentDate,
      appointmentTime,
      reason,
      userNotes,
      dataSharing: dataSharing || { enabled: false },
      status: 'pending',
    });

    const savedAppointment = await appointment.save();

    // Create linked chat for this appointment
    const chat = new this.appointmentChatModel({
      appointmentId: savedAppointment._id,
      userId: new Types.ObjectId(userId),
      vetId: new Types.ObjectId(vetId),
    });
    await chat.save();

    // Link chat to appointment
    savedAppointment.linkedChatId = chat._id as Types.ObjectId;
    await savedAppointment.save();

    return savedAppointment;
  }

  async getUserAppointments(userId: string): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('vetId', 'firstName lastName specializations profileImage')
      .populate('linkedChatId')
      .sort({ appointmentDate: 1 })
      .exec();
  }

  async getVetAppointments(vetId: string): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ vetId: new Types.ObjectId(vetId) })
      .populate('userId', 'username email')
      .populate('linkedChatId')
      .sort({ appointmentDate: 1 })
      .exec();
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate('userId')
      .populate('vetId')
      .populate('linkedChatId')
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  /**
   * Vet confirms appointment
   */
  async confirmAppointment(id: string, vetId: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.vetId.toString() !== vetId) {
      throw new BadRequestException('Only the assigned vet can confirm this appointment');
    }

    appointment.status = 'confirmed';
    appointment.confirmedAt = new Date();
    appointment.updatedAt = new Date();

    return appointment.save();
  }

  /**
   * Vet rejects appointment
   */
  async rejectAppointment(
    id: string,
    vetId: string,
    rejectionReason: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.vetId.toString() !== vetId) {
      throw new BadRequestException('Only the assigned vet can reject this appointment');
    }

    appointment.status = 'rejected';
    appointment.rejectionReason = rejectionReason;
    appointment.updatedAt = new Date();

    return appointment.save();
  }

  /**
   * Add medical records (notes, prescription) by vet
   */
  async addMedicalRecords(
    appointmentId: string,
    vetId: string,
    medicalRecords: {
      notes: string;
      prescription?: string;
      medications?: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
      }>;
      followUpDate?: Date;
    },
  ): Promise<Appointment> {
    const appointment = await this.appointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.vetId.toString() !== vetId) {
      throw new BadRequestException('Only the assigned vet can add medical records');
    }

    // Only allow adding records if data sharing is enabled
    if (!appointment.dataSharing?.enabled) {
      throw new BadRequestException('User has not shared diagnostic data for this appointment');
    }

    appointment.medicalRecords = {
      ...medicalRecords,
      addedAt: new Date(),
      addedBy: new Types.ObjectId(vetId),
    };

    appointment.updatedAt = new Date();
    return appointment.save();
  }

  async cancelAppointment(id: string, userId: string): Promise<void> {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.userId.toString() !== userId) {
      throw new BadRequestException('You can only cancel your own appointments');
    }

    if (appointment.status === 'completed') {
      throw new BadRequestException('Cannot cancel completed appointments');
    }

    appointment.status = 'cancelled';
    appointment.updatedAt = new Date();
    await appointment.save();
  }

  /**
   * Set vet availability/schedule
   */
  async setVetAvailability(
    vetId: string,
    weeklySchedule: any,
    appointmentDuration: number = 30,
  ): Promise<VetAvailability> {
    let availability = await this.vetAvailabilityModel.findOne({ vetId: new Types.ObjectId(vetId) });

    if (!availability) {
      availability = new this.vetAvailabilityModel({
        vetId: new Types.ObjectId(vetId),
        weeklySchedule,
        appointmentDuration,
      });
    } else {
      availability.weeklySchedule = weeklySchedule;
      availability.appointmentDuration = appointmentDuration;
    }

    return availability.save();
  }

  /**
   * Add break time for vet
   */
  async addBreak(
    vetId: string,
    date: Date,
    startTime: string,
    endTime: string,
    reason: string,
  ): Promise<VetAvailability> {
    const availability = await this.vetAvailabilityModel.findOne({ vetId: new Types.ObjectId(vetId) });

    if (!availability) {
      throw new NotFoundException('Vet availability not configured');
    }

    availability.breaks.push({ date, startTime, endTime, reason });
    return availability.save();
  }

  /**
   * Add holiday for vet
   */
  async addHoliday(vetId: string, date: Date, reason: string): Promise<VetAvailability> {
    const availability = await this.vetAvailabilityModel.findOne({ vetId: new Types.ObjectId(vetId) });

    if (!availability) {
      throw new NotFoundException('Vet availability not configured');
    }

    availability.holidays.push({ date, reason });
    return availability.save();
  }
}

