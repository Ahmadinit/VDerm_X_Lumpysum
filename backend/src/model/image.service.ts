/*import * as tf from '@tensorflow/tfjs-node';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ModelService {
  private model: tf.LayersModel;

  constructor() {
    this.loadModel();
  }

  async loadModel() {
    const modelPath = path.join(__dirname, '..', 'model', 'final_model.keras');
    this.model = await tf.loadLayersModel(`file://${modelPath}`);
    console.log('Model loaded successfully.');
  }

  async predict(imagePath: string): Promise<number[]> {
    // Read and preprocess the image
    const imageBuffer = fs.readFileSync(imagePath);
    const tensor = tf.node.decodeImage(imageBuffer, 3)
      .resizeBilinear([256, 256]) // Resize to the required input size
      .expandDims(0) // Add batch dimension
      .toFloat()
      .div(255.0); // Normalize

    // Perform prediction
    const prediction = this.model.predict(tensor) as tf.Tensor;
    const predictionArray = prediction.dataSync(); // Get prediction result as a flat array
    return Array.from(predictionArray); // Convert to a regular JavaScript array
  }
}
*/

