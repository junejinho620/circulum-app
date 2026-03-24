import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class PushService {
  private readonly expo = new Expo();
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Send a push notification to a single user by their userId.
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'pushToken'],
    });

    if (!user?.pushToken) return;
    if (!Expo.isExpoPushToken(user.pushToken)) {
      this.logger.warn(`Invalid push token for user ${userId}: ${user.pushToken}`);
      return;
    }

    await this.sendMessages([{
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data: { ...data, userId },
    }]);
  }

  /**
   * Send push notifications to multiple users.
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    if (userIds.length === 0) return;

    const users = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.pushToken'])
      .where('user.id IN (:...ids)', { ids: userIds })
      .andWhere('user.pushToken IS NOT NULL')
      .getMany();

    const messages: ExpoPushMessage[] = users
      .filter((u) => u.pushToken && Expo.isExpoPushToken(u.pushToken))
      .map((u) => ({
        to: u.pushToken!,
        sound: 'default' as const,
        title,
        body,
        data: { ...data, userId: u.id },
      }));

    if (messages.length > 0) {
      await this.sendMessages(messages);
    }
  }

  /**
   * Internal: chunk and send messages via Expo.
   */
  private async sendMessages(messages: ExpoPushMessage[]): Promise<void> {
    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync(chunk);

        // Log errors but don't throw — push is best-effort
        for (const ticket of tickets) {
          if (ticket.status === 'error') {
            this.logger.error(`Push error: ${ticket.message}`, ticket.details);
          }
        }
      } catch (err) {
        this.logger.error('Failed to send push notification chunk', err);
      }
    }
  }
}
