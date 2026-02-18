// src/appointments/appointments.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Headers,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './schema/appointment.schema';
import * as multer from 'multer';
import * as path from 'path';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = `${Date.now()}-${file.originalname}`;
          callback(null, uniqueName);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
    }),
  )
  async createAppointment(
    @Headers('x-user-id') userId: string,
    @Body('vetId') vetId: string,
    @Body('date') date: string,
    @Body('timeSlot') timeSlot: string,
    @Body('reason') reason: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Appointment> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required in headers');
    }

    if (!vetId || !date || !timeSlot || !reason) {
      throw new BadRequestException('vetId, date, timeSlot, and reason are required');
    }

    const imageUrl = file ? `uploads/${file.filename}` : undefined;

    return this.appointmentsService.createAppointment(
      userId,
      vetId,
      new Date(date),
      timeSlot,
      reason,
      imageUrl,
    );
  }

  @Get('user/:userId')
  async getUserAppointments(@Param('userId') userId: string): Promise<Appointment[]> {
    return this.appointmentsService.getUserAppointments(userId);
  }

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

  @Get(':id')
  async getAppointmentById(@Param('id') id: string): Promise<Appointment> {
    const appointment = await this.appointmentsService.getAppointmentById(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  @Patch(':id/status')
  async updateAppointmentStatus(
    @Param('id') id: string,
    @Headers('x-user-role') userRole: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
    @Body('rejectedReason') rejectedReason?: string,
  ): Promise<Appointment> {
    if (userRole !== 'vet') {
      throw new UnauthorizedException('Only vets can update appointment status');
    }

    if (!['confirmed', 'rejected', 'completed'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    return this.appointmentsService.updateAppointmentStatus(
      id,
      status,
      notes,
      rejectedReason,
    );
  }

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
}
