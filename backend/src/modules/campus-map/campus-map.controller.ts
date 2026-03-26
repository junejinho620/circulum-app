import {
  Controller, Get, Post, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { CampusMapService } from './campus-map.service';

@UseGuards(JwtAuthGuard)
@Controller('campus')
export class CampusMapController {
  constructor(private readonly service: CampusMapService) {}

  @Get('locations')
  getLocations(
    @CurrentUser() user: User,
    @Query('category') category?: string,
  ) {
    return this.service.getLocations(user.universityId, category);
  }

  @Get('locations/:id')
  getLocationDetail(@Param('id') id: string) {
    return this.service.getLocationDetail(id);
  }

  @Get('events')
  getEvents(@CurrentUser() user: User) {
    return this.service.getUpcomingEvents(user.universityId);
  }

  @Get('locations/:id/events')
  getEventsAtLocation(@Param('id') id: string) {
    return this.service.getEventsAtLocation(id);
  }

  @Get('saved')
  getSaved(@CurrentUser() user: User) {
    return this.service.getSavedPlaces(user.id);
  }

  @Post('saved/:locationId')
  toggleSaved(
    @CurrentUser() user: User,
    @Param('locationId') locationId: string,
    @Body() body: { type?: string },
  ) {
    return this.service.toggleSaved(user.id, locationId, body?.type);
  }

  @Delete('saved/:locationId')
  removeSaved(
    @CurrentUser() user: User,
    @Param('locationId') locationId: string,
  ) {
    return this.service.removeSaved(user.id, locationId);
  }
}
