// src/diagnosis/diagnosis.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisHistory, DiagnosisHistorySchema } from './schema/diagnosis-history.schema';
import { User, UserSchema } from '../user/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiagnosisHistory.name, schema: DiagnosisHistorySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DiagnosisController],
  providers: [DiagnosisService],
  exports: [DiagnosisService],
})
export class DiagnosisModule {}
