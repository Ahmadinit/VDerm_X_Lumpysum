// src/vets/vet.schema.ts
import { Schema, Document } from 'mongoose';

export const VetSchema = new Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  contact: { type: String, required: true },
  area: { type: String, required: true },
  availability: { type: String },
  imageUrl: { type: String },
});

export interface Vet extends Document {
  id: string;
  name: string;
  specialization: string;
  contact: string;
  area: string;
  availability?: string;
  imageUrl?: string;
}
