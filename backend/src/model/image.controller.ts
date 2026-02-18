/*import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Controller to handle image prediction
@Controller('image')
export class ImageController {

  // Endpoint to handle image upload and prediction
  @Post('predict')
  @UseInterceptors(FileInterceptor('image', {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, './uploads'); // Specify the upload folder
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    })
  }))
  async predictImage(@UploadedFile() file: Express.Multer.File) {
    try {
      // Read the image from the uploaded file
      const imageBuffer = fs.readFileSync(file.path);

      // Convert the image to base64
      const imageBase64 = imageBuffer.toString('base64');

      // Send the image data to the Flask server for prediction
      const response = await axios.post('http://127.0.0.1:5000/predict', {
        image: imageBase64
      });

      // Clean up the uploaded image file after prediction
      fs.unlinkSync(file.path);

      // Return the prediction response from Flask
      return response.data;
    } catch (error) {
      console.error('Error during prediction:', error);
      throw error;
    }
  }
}*/
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Controller('image')
export class ImageController {
  @Post('predict')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.diskStorage({
        destination: './uploads', // Directory to save uploaded files
        filename: (req, file, callback) => {
          callback(null, file.originalname); // Save file with the original name
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // Set the maximum file size (10MB)
      },
    }),
  )
  async predict(@UploadedFile() file) {
    try {
      if (!file) {
        return { error: 'No file uploaded.' };
      }

      // Get the file path
      const filePath = path.join(__dirname, '..', '..', 'uploads', file.originalname);

      // Read the file and convert it to Base64
      const imageData = fs.readFileSync(filePath, { encoding: 'base64' });

      // Send the image data to Flask for prediction
      const response = await axios.post('http://localhost:5000/predict', { image: imageData });

      // Delete the file after processing
      fs.unlinkSync(filePath);

      // Return the Flask prediction response
      return response.data;
    } catch (error) {
      console.error(error);
      return { error: 'An error occurred while processing the image.' };
    }
  }
}
