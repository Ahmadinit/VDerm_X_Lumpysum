import { Module } from '@nestjs/common';
import { ImageControllerr } from './image.controller';
import { DiagnosisModule } from '../diagnosis/diagnosis.module';

@Module({
  imports: [DiagnosisModule],
  controllers: [ImageControllerr],
})
export class ImageModulee {}





