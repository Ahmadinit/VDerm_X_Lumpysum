// src/diagnosis/diagnosis.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DiagnosisHistory, DiagnosisHistoryDocument } from './schema/diagnosis-history.schema';
import { User, UserDocument } from '../user/schema/user.schema';

@Injectable()
export class DiagnosisService {
  constructor(
    @InjectModel(DiagnosisHistory.name) private diagnosisModel: Model<DiagnosisHistoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async saveDiagnosis(
    userId: string,
    imageUrl: string,
    prediction: any,
    location?: string,
  ): Promise<DiagnosisHistory> {
    // Verify user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('Invalid user ID');
    }

    const diagnosis = new this.diagnosisModel({
      userId: new Types.ObjectId(userId),
      imageUrl,
      prediction: {
        classification: prediction.classification,
        confidence: prediction.prediction || prediction.confidence,
      },
      location,
      timestamp: new Date(),
    });

    return diagnosis.save();
  }

  async getUserDiagnosisHistory(userId: string): Promise<DiagnosisHistory[]> {
    return this.diagnosisModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getDiagnosisById(id: string): Promise<DiagnosisHistory> {
    const diagnosis = await this.diagnosisModel.findById(id).exec();
    
    if (!diagnosis) {
      throw new NotFoundException('Diagnosis not found');
    }

    return diagnosis;
  }
}
