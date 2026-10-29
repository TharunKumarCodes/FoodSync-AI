import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { requireAuth } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, readAt: null },
    });

    res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const notif = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notif) {
      throw new AppError('Notification not found', 404);
    }

    if (notif.userId !== req.user!.id) {
      throw new AppError('Unauthorized', 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
