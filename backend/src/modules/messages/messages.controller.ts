import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { MessagesService, InitiateConversationDto, SendMessageDto } from './messages.service';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  getList(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.messagesService.getConversationList(user.id, page);
  }

  @Post('initiate')
  initiate(@Body() dto: InitiateConversationDto, @CurrentUser() user: User) {
    return this.messagesService.initiateConversation(dto, user.id);
  }

  @Patch(':id/accept')
  @HttpCode(HttpStatus.OK)
  accept(@Param('id') id: string, @CurrentUser() user: User) {
    return this.messagesService.acceptConversation(id, user.id);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.getMessages(id, user.id, page, Math.min(limit, 100));
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.sendMessage(id, dto, user.id);
  }

  @Patch(':id/block')
  @HttpCode(HttpStatus.OK)
  block(@Param('id') id: string, @CurrentUser() user: User) {
    return this.messagesService.blockConversation(id, user.id);
  }

  @Delete(':id')
  deleteConversation(@Param('id') id: string, @CurrentUser() user: User) {
    return this.messagesService.deleteConversation(id, user.id);
  }
}
