import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusLocation } from '../../database/entities/campus-location.entity';
import { CampusEvent } from '../../database/entities/campus-event.entity';
import { SavedPlace } from '../../database/entities/saved-place.entity';
import { CampusMapService } from './campus-map.service';
import { CampusMapController } from './campus-map.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CampusLocation, CampusEvent, SavedPlace])],
  controllers: [CampusMapController],
  providers: [CampusMapService],
  exports: [CampusMapService],
})
export class CampusMapModule {}
