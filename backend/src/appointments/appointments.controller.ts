// src/appointments/appointments.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query,
  Headers,
  BadRequestException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './schema/appointment.schema';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Get available slots for a vet on a specific date
   * Prevents double-booking (conflict resolution)
   * GET /appointments/availability/:vetId?date=YYYY-MM-DD&duration=30
   */
  @Get('availability/:vetId')
  async getAvailableSlots(
    @Param('vetId') vetId: string,
    @Query('date') dateStr: string,
    @Query('duration') duration?: string,
  ): Promise<{ slots: string[] }> {
    if (!dateStr) {
      throw new BadRequestException('Date query parameter is required (YYYY-MM-DD format)');
    }

    const date = new Date(dateStr);
    const slotDuration = duration ? parseInt(duration, 10) : 30;

    const slots = await this.appointmentsService.getAvailableSlots(vetId, date, slotDuration);
    return { slots };
  }

  /**
   * Create appointment with optional data sharing
   * POST /appointments/book
   */
  @Post('book')
  async createAppointment(
    @Headers('x-user-id') userId: string,
    @Body() body: {
      vetId: string;
      appointmentDate: string; // YYYY-MM-DD
      appointmentTime: string; // HH:mm
      reason: string;
      userNotes?: string;
      dataSharing?: {
        enabled: boolean;
        diagnosisId?: string;
        images?: string[];
        analysisText?: string;
        notes?: string;
      };
    },
  ): Promise<Appointment> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required in headers');
    }

    const { vetId, appointmentDate, appointmentTime, reason, userNotes, dataSharing } = body;

    if (!vetId || !appointmentDate || !appointmentTime || !reason) {
      throw new BadRequestException(
        'vetId, appointmentDate, appointmentTime, and reason are required',
      );
    }

    return this.appointmentsService.createAppointment(
      userId,
      vetId,
      new Date(appointmentDate),
      appointmentTime,
      reason,
      userNotes,
      dataSharing,
    );
  }

  /**
   * Get user's appointments
   * GET /appointments/user/:userId
   */
  @Get('user/:userId')
  async getUserAppointments(@Param('userId') userId: string): Promise<Appointment[]> {
    return this.appointmentsService.getUserAppointments(userId);
  }

  /**
   * Get vet's appointments (incoming booking requests)
   * GET /appointments/vet/:vetId
   */
  @Get('vet/:vetId')
  async getVetAppointments(
    @Param('vetId') vetId: string,
    @Headers('x-user-role') userRole?: string,
  ): Promise<Appointment[]> {
    if (userRole !== 'vet') {
      throw new UnauthorizedException('Only vets can access this endpoint');
    }
    return this.appointmentsService.getVetAppointments(vetId);
  }

  /**
   * Get specific appointment details
   * GET /appointments/:id
   */
  @Get(':id')
  async getAppointmentById(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentsService.getAppointmentById(id);
  }

  /**
   * Vet confirms appointment
   * PATCH /appointments/:id/confirm
   */
  @Patch(':id/confirm')
  async confirmAppointment(
    @Param('id') id: string,
    @Headers('x-user-id') vetId: string,
    @Headers('x-user-role') userRole: string,
  ): Promise<Appointment> {
    if (userRole !== 'vet') {
      throw new UnauthorizedException('Only vets can confirm appointments');
    }

    return this.appointmentsService.confirmAppointment(id, vetId);
  }

  /**
   * Vet rejects appointment
   * PATCH /appointments/:id/reject
   */
  @Patch(':id/reject')
  async rejectAppointment(
    @Param('id') id: string,
    @Headers('x-user-id') vetId: string,
    @Headers('x-user-role') userRole: string,
    @Body('rejectionReason') rejectionReason: string,
  ): Promise<Appointment> {
    if (userRole !== 'vet') {
      throw new UnauthorizedException('Only vets can reject appointments');
    }

    if (!rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    return this.appointmentsService.rejectAppointment(id, vetId, rejectionReason);
  }

  /**
   * Vet adds medical records (notes, prescription)
   * PATCH /appointments/:id/medical-records
   */
  @Patch(':id/medical-records')
  async addMedicalRecords(
    @Param('id') appointmentId: string,
    @Headers('x-user-id') vetId: string,
    @Headers('x-user-role') userRole: string,
    @Body() medicalRecords: {
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
    if (userRole !== 'vet') {
      throw new UnauthorizedException('Only vets can add medical records');
    }

    if (!medicalRecords.notes) {
      throw new BadRequestException('Medical notes are required');
    }

    return this.appointmentsService.addMedicalRecords(appointmentId, vetId, medicalRecords);
  }

  /**
   * Cancel appointment
   * DELETE /appointments/:id
   */
  @Delete(':id')
  async cancelAppointment(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    await this.appointmentsService.cancelAppointment(id, userId);
    return { message: 'Appointment cancelled successfully' };
  }

  /**
   * Set vet's weekly availability schedule
   * POST /appointments/vet/availability/schedule
   */
  @Post('vet/availability/schedule')
  async setVetAvailability(
    @Headers('x-user-id') vetId: string,
    @Headers('x-user-role') userRole: string,
    @Body() body: {
      weeklySchedule: any;
      appointmentDuration?: number;
    },
  ): Promise<any> {
    if (userRole !== 'vet') {
      throw new UnauthorizedException('Only vets can set their availability');
    }

    return this.appointmentsService.setVetAvailability(
      vetId,
      body.weeklySchedule,
      body.appointmentDuration || 30,
    );
  }

  /**
   * Add break time for vet
   * POST /appointments/vet/availability/break
   */
  @Post('vet/availability/break')
  async addBreak(
    @Headers('x-user-id') vetId: string,
    @Headers('x-user-role') userRole: string,
    @Body() body: {
      date: string; // YYYY-MM-DD
      startTime: string; // HH:mm
      endTime: string; // HH:mm
      reason: string;
    },
  ): Promise<any> {
    if (userRole !== 'vet') {
      throw new UnauthorizedException('Only vets can add breaks');
    }

    const { date, startTime, endTime, reason } = body;

    if (!date || !startTime || !endTime || !reason) {
      throw new BadRequestException('date, startTime, endTime, and reason are required');
    }

    return this.appointmentsService.addBreak(vetId, new Date(date), startTime, endTime, reason);
  }

  /**
   * Add holiday for vet
   * POST /appointments/vet/availability/holiday
   */
  @Post('vet/availability/holiday')
  async addHoliday(
    @Headers('x-user-id') vetId: string,
    @Headers('x-user-role') userRole: string,
    @Body() body: {
      date: string; // YYYY-MM-DD
      reason: string;
    },
  ): Promise<any> {
    if (userRole !== 'vet') {
      throw new UnauthorizedException('Only vets can add holidays');
    }

    const { date, reason } = body;

    if (!date || !reason) {
      throw new BadRequestException('date and reason are required');
    }

    return this.appointmentsService.addHoliday(vetId, new Date(date), reason);
  }
}
