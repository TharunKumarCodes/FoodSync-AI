import { prisma } from './prisma';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

/**
 * Creates an in-app notification tied to a successful business action.
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedEntityType,
  relatedEntityId,
}: CreateNotificationParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
      },
    });
  } catch (err) {
    console.error(`Failed to create notification for user ${userId}:`, err);
  }
}
