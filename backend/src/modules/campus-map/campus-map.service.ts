import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CampusLocation } from '../../database/entities/campus-location.entity';
import { CampusEvent } from '../../database/entities/campus-event.entity';
import { SavedPlace } from '../../database/entities/saved-place.entity';

@Injectable()
export class CampusMapService {
  constructor(
    @InjectRepository(CampusLocation) private locationRepo: Repository<CampusLocation>,
    @InjectRepository(CampusEvent) private eventRepo: Repository<CampusEvent>,
    @InjectRepository(SavedPlace) private savedRepo: Repository<SavedPlace>,
  ) {}

  // ─── Locations ────────────────────────────────────────────

  async getLocations(universityId: string, category?: string) {
    const qb = this.locationRepo
      .createQueryBuilder('l')
      .where('l.universityId = :universityId', { universityId })
      .andWhere('l.isActive = true');

    if (category) {
      qb.andWhere('l.category = :category', { category });
    }

    return qb.orderBy('l.name', 'ASC').getMany();
  }

  async getLocationDetail(locationId: string) {
    const location = await this.locationRepo.findOne({
      where: { id: locationId },
      relations: ['events'],
    });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  // ─── Events ───────────────────────────────────────────────

  async getUpcomingEvents(universityId: string) {
    return this.eventRepo.find({
      where: {
        universityId,
        startTime: MoreThan(new Date()),
      },
      relations: ['location'],
      order: { startTime: 'ASC' },
      take: 20,
    });
  }

  async getEventsAtLocation(locationId: string) {
    return this.eventRepo.find({
      where: {
        locationId,
        startTime: MoreThan(new Date()),
      },
      order: { startTime: 'ASC' },
    });
  }

  // ─── Saved Places ────────────────────────────────────────

  async getSavedPlaces(userId: string) {
    return this.savedRepo.find({
      where: { userId },
      relations: ['location'],
      order: { createdAt: 'DESC' },
    });
  }

  async toggleSaved(userId: string, locationId: string, type = 'favorite') {
    const existing = await this.savedRepo.findOne({ where: { userId, locationId } });
    if (existing) {
      await this.savedRepo.remove(existing);
      return { saved: false };
    }
    await this.savedRepo.save(
      this.savedRepo.create({ userId, locationId, type: type as any }),
    );
    return { saved: true };
  }

  async removeSaved(userId: string, locationId: string) {
    await this.savedRepo.delete({ userId, locationId });
    return { success: true };
  }
}
