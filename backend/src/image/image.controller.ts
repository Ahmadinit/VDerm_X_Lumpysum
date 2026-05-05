/*import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';  // For creating temporary files

@Controller('images')
export class ImageControllerr {
  @Post('predicts')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          callback(null, file.originalname);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
    }),
  )
  async predict(@UploadedFile() file) {
    try {
      if (!file) {
        return { error: 'No file uploaded.' };
      }

      const filePath = path.join(__dirname, '..', '..', 'uploads', file.originalname);
      const imageData = fs.readFileSync(filePath);

      // Create a temporary file to store the image
      const tempFilePath = path.join(os.tmpdir(), 'temp_image.jpg');
      fs.writeFileSync(tempFilePath, imageData);  // Write the image to the temp file

      // Resolve the Python script path dynamically
      const pythonScript = path.resolve(
        __dirname,
        process.env.NODE_ENV === 'production' ? '../scripts/predict.py' : '../../src/scripts/predict.py'
      );
      console.log('Resolved Python script path:', pythonScript);

      if (!fs.existsSync(pythonScript)) {
        throw new Error(`Python script not found at path: ${pythonScript}`);
      }

      // Execute the Python script and pass the path to the temporary image file
      const command = `python ${pythonScript} "${tempFilePath}"`;

      const prediction = await new Promise<string>((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(`Error: ${stderr || error.message}`);
          }
          resolve(stdout);
        });
      });

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);  // Remove the temporary file after execution

      return { prediction: JSON.parse(prediction) };

    } catch (error) {
      console.error(error);
      return { error: error.message || 'An error occurred while processing the image.' };
    }
  }
}*/

import {
  BadRequestException,
  Controller,
  Headers,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { DiagnosisService } from '../diagnosis/diagnosis.service';

@Controller('images')
export class ImageControllerr {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post('predicts')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.diskStorage({
        destination: (req, file, callback) => {
          const uploadDir = path.resolve(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          callback(null, uploadDir);
        },
        filename: (req, file, callback) => {
          const safeOriginalName = path.basename(file.originalname || 'image.jpg');
          const uniqueName = `${Date.now()}-${safeOriginalName}`;
          callback(null, uniqueName);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only JPEG, PNG, and WEBP images are supported.'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async predict(
    @UploadedFile() file,
    @Headers('x-user-id') userId?: string,
  ) {
    try {
      console.log("Received file:", file);  // Log the uploaded file

      if (!file) {
        console.error("No file uploaded.");  // Log when no file is uploaded
        throw new BadRequestException('No file uploaded.');
      }

      const filePath = path.resolve(file.path);
      console.log("File path:", filePath);  // Log the file path

      if (!fs.existsSync(filePath)) {
        throw new Error(`Uploaded file not found at: ${filePath}`);
      }

      // Resolve the Python script path dynamically
      const pythonScript = path.resolve(
        __dirname,
        process.env.NODE_ENV === 'production' ? '../scripts/predict.py' : '../../src/scripts/predict.py'
      );
      console.log('Resolved Python script path:', pythonScript);

      if (!fs.existsSync(pythonScript)) {
        console.error(`Python script not found at path: ${pythonScript}`);  // Log if the script is not found
        throw new Error(`Python script not found at path: ${pythonScript}`);
      }

      // Use Python from virtual environment
      const venvPythonPath = path.resolve(__dirname, '..', '..', '..', '.venv', 'Scripts', 'python.exe');
      const pythonPath = fs.existsSync(venvPythonPath) ? venvPythonPath : 'python';
      console.log('Using Python from:', pythonPath);

      const prediction = await new Promise<string>((resolve, reject) => {
        execFile(
          pythonPath,
          [pythonScript, filePath],
          { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } },
          (error, stdout, stderr) => {
          if (error) {
            console.error("Python script execution error:", stderr || error.message);  // Log script errors
            reject(`Error: ${stderr || error.message}`);
            return;
          }

          if (stderr?.trim()) {
            console.warn('Python stderr:', stderr);
          }

          console.log("Prediction result:", stdout);  // Log the prediction result
          resolve(stdout);
          },
        );
      });

      // Parse only the JSON payload from stdout
      const trimmed = prediction.trim();
      const jsonStart = trimmed.indexOf('{');
      const jsonEnd = trimmed.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
        throw new Error(`Invalid prediction output: ${trimmed}`);
      }

      const predictionData = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));

      // Auto-save diagnosis if userId is provided
      let diagnosisId = null;
      if (userId) {
        try {
          const imageUrl = `uploads/${file.filename}`;
          const savedDiagnosis = await this.diagnosisService.saveDiagnosis(
            userId,
            imageUrl,
            predictionData,
          );
          diagnosisId = (savedDiagnosis as any)._id.toString();
          console.log('Diagnosis saved successfully for user:', userId, 'ID:', diagnosisId);
        } catch (diagnosisError) {
          console.error('Failed to save diagnosis:', diagnosisError.message);
          // Don't fail the request if diagnosis saving fails
        }
      }

      return { 
        prediction: predictionData,
        diagnosisId,
      };

    } catch (error) {
      console.error("Error during image processing:", error);  // Log detailed error information
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.message || 'An error occurred while processing the image.',
      );
    }
  }
}
