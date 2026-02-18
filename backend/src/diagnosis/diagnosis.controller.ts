// src/diagnosis/diagnosis.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  Body, 
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisHistory } from './schema/diagnosis-history.schema';

@Controller('diagnosis')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post('save')
  async saveDiagnosis(
    @Body('userId') userId: string,
    @Body('imageUrl') imageUrl: string,
    @Body('prediction') prediction: any,
    @Body('location') location?: string,
  ): Promise<DiagnosisHistory> {
    if (!userId || !imageUrl || !prediction) {
      throw new BadRequestException('userId, imageUrl, and prediction are required');
    }

    return this.diagnosisService.saveDiagnosis(userId, imageUrl, prediction, location);
  }

  @Get('user/:userId')
  async getUserDiagnosisHistory(
    @Param('userId') userId: string,
  ): Promise<DiagnosisHistory[]> {
    return this.diagnosisService.getUserDiagnosisHistory(userId);
  }

  @Get(':id')
  async getDiagnosisById(@Param('id') id: string): Promise<DiagnosisHistory> {
    const diagnosis = await this.diagnosisService.getDiagnosisById(id);
    if (!diagnosis) {
      throw new NotFoundException('Diagnosis not found');
    }
    return diagnosis;
  }
}
