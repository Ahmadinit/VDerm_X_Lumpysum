// src/vets/vet.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { VetService } from './vets.service';
import { Vet } from './vet.entity';


@Controller('vets')
export class VetController {
  constructor(private readonly vetService: VetService) {}

  @Get()
  async getAll(): Promise<Vet[]> {
    return this.vetService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<Vet> {
    return this.vetService.findOne(id);
  }

  @Post('createvets')
  async create(@Body() vetData: Partial<Vet>): Promise<Vet> {
    return this.vetService.create(vetData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<Vet>): Promise<Vet> {
    return this.vetService.update(id, updateData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<Vet> {
    return this.vetService.delete(id);
  }
}
