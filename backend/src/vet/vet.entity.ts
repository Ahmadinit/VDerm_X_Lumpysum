// src/vets/vet.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Vet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  specialization: string;

  @Column()
  contact: string;

  @Column()
  area: string;

  @Column({ nullable: true })
  availability: string; // e.g., "9:00 AM - 5:00 PM"

  @Column({ nullable: true })
  imageUrl: string; // URL to vet's profile image
}
