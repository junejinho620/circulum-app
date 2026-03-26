import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { TimetableService, CreateBlockDto, BulkImportDto } from './timetable.service';

@UseGuards(JwtAuthGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly service: TimetableService) {}

  @Get()
  getSchedule(@CurrentUser() user: User) {
    return this.service.getSchedule(user.id);
  }

  @Post('blocks')
  createBlock(@CurrentUser() user: User, @Body() dto: CreateBlockDto) {
    return this.service.createBlock(user.id, dto);
  }

  @Patch('blocks/:id')
  updateBlock(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: Partial<CreateBlockDto>,
  ) {
    return this.service.updateBlock(id, user.id, dto);
  }

  @Delete('blocks/:id')
  deleteBlock(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.deleteBlock(id, user.id);
  }

  @Post('import')
  bulkImport(@CurrentUser() user: User, @Body() dto: BulkImportDto) {
    return this.service.bulkImport(user.id, dto);
  }

  @Delete('clear')
  clearSchedule(@CurrentUser() user: User) {
    return this.service.clearSchedule(user.id);
  }
}
