// src/vets/vet.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vet } from './vet.entity';
import { User, UserDocument } from '../user/schema/user.schema';


@Injectable()
export class VetService {
  constructor(
    @InjectModel('Vet') private readonly vetModel: Model<Vet>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll(): Promise<any[]> {
    // Query User collection for users with role='vet'
    return this.userModel.find({ role: 'vet' }).select('-password -otp').exec();
  }

  async findOne(id: string): Promise<any> {
    // Query User collection for vet by ID
    return this.userModel.findOne({ _id: id, role: 'vet' }).select('-password -otp').exec();
  }

  async create(vetData: Partial<Vet>): Promise<Vet> {
    const newVet = new this.vetModel(vetData);
    return newVet.save();
  }

  async update(id: string, updateData: Partial<Vet>): Promise<Vet> {
    return this.vetModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string): Promise<Vet> {
    return this.vetModel.findByIdAndDelete(id).exec();
  }
}
