import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Poll } from '../../database/entities/poll.entity';
import { PollOption } from '../../database/entities/poll-option.entity';
import { PollVote } from '../../database/entities/poll-vote.entity';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Poll, PollOption, PollVote])],
  controllers: [PollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}
