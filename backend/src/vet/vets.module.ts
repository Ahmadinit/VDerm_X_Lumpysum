// src/vets/vet.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VetSchema } from './schema/vet.schema';
import { VetController } from './vets.controller';
import { VetService } from './vets.service';
import { User, UserSchema } from '../user/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Vet', schema: VetSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [VetController],
  providers: [VetService],
})
export class VetModule {}
