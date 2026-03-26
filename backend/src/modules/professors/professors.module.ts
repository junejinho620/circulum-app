import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Professor } from '../../database/entities/professor.entity';
import { ProfessorReview } from '../../database/entities/professor-review.entity';
import { ProfessorsService } from './professors.service';
import { ProfessorsController } from './professors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Professor, ProfessorReview])],
  controllers: [ProfessorsController],
  providers: [ProfessorsService],
  exports: [ProfessorsService],
})
export class ProfessorsModule {}
