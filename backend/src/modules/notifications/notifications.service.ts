import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../database/entities/notification.entity';
import { PushService } from './push.service';

// Map notification types to human-readable push content
const PUSH_CONTENT: Record<NotificationType, { title: string; bodyTemplate: string }> = {
  [NotificationType.COMMENT_REPLY]: { title: 'New Reply', bodyTemplate: 'Someone replied to your comment' },
  [NotificationType.POST_COMMENT]: { title: 'New Comment', bodyTemplate: 'Someone commented on your post' },
  [NotificationType.NEW_MESSAGE]: { title: 'New Message', bodyTemplate: 'You have a new message' },
  [NotificationType.MESSAGE_REQUEST]: { title: 'Message Request', bodyTemplate: 'Someone wants to message you' },
  [NotificationType.VOTE_MILESTONE]: { title: 'Milestone!', bodyTemplate: 'Your post hit a vote milestone' },
  [NotificationType.MODERATION_WARNING]: { title: 'Warning', bodyTemplate: 'You received a moderation warning' },
  [NotificationType.MODERATION_SUSPENSION]: { title: 'Account Suspended', bodyTemplate: 'Your account has been suspended' },
  [NotificationType.MODERATION_BAN]: { title: 'Account Banned', bodyTemplate: 'Your account has been banned' },
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private pushService: PushService,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    payload: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({ userId, type, payload });
    const saved = await this.notificationRepo.save(notification);

    // Fire push notification (best-effort, non-blocking)
    const content = PUSH_CONTENT[type];
    this.pushService.sendToUser(
      userId,
      content.title,
      payload.message ?? content.bodyTemplate,
      { type, notificationId: saved.id, ...payload },
    ).catch(() => {}); // swallow — push is best-effort

    return saved;
  }

  async getForUser(userId: string, page = 1, limit = 30) {
    const [items, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async markRead(userId: string, notificationId: string) {
    await this.notificationRepo.update(
      { id: notificationId, userId },
      { isRead: true },
    );
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({ where: { userId, isRead: false } });
  }
}
