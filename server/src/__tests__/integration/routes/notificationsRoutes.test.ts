/**
 * Integration tests for Notifications Routes
 *
 * Tests HTTP request/response cycle through the Express router
 * with mocked Prisma layer. Validates status codes, response shapes,
 * Zod validation, and error handling branches.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../testApp';

// ---------------------------------------------------------------------------
// Mocks — must be before any import that pulls in the mocked modules
// ---------------------------------------------------------------------------

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../../../services/portalNotificationService', () => ({
  portalNotificationService: {
    getForPortal: vi.fn(),
    getUnreadCount: vi.fn(),
    markAllAsRead: vi.fn(),
  },
  PortalType: {},
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import notificationsRouter from '../../../routes/notificationsRoutes';
import { prisma } from '../../../lib/prisma';
import { portalNotificationService } from '../../../services/portalNotificationService';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const TEST_USER_ID = 'test-user-id';
const app = createTestApp(notificationsRouter, '/api/notifications', { userId: TEST_USER_ID });

const mockNotification = {
  id: 'notif-1',
  userId: TEST_USER_ID,
  type: 'order_update',
  title: 'Order shipped',
  message: 'Your order ORD-001 has been shipped',
  read: false,
  metadata: '{"orderId":"order-1"}',
  createdAt: new Date('2026-01-15'),
};

const mockNotificationRead = {
  ...mockNotification,
  read: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Core Notification Routes
// =============================================================================

describe('Core Notification Routes', () => {
  describe('GET /api/notifications', () => {
    it('returns user notifications', async () => {
      (prisma.notification.findMany as any).mockResolvedValue([mockNotification]);

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe('notif-1');
      expect(res.body[0].metadata).toEqual({ orderId: 'order-1' });
    });

    it('returns empty array when no notifications', async () => {
      (prisma.notification.findMany as any).mockResolvedValue([]);

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('filters unread only when requested', async () => {
      (prisma.notification.findMany as any).mockResolvedValue([]);

      await request(app)
        .get('/api/notifications')
        .query({ unreadOnly: 'true' });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: TEST_USER_ID, read: false },
        })
      );
    });

    it('passes limit and offset', async () => {
      (prisma.notification.findMany as any).mockResolvedValue([]);

      await request(app)
        .get('/api/notifications')
        .query({ limit: '10', offset: '5' });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        })
      );
    });

    it('caps limit at 100', async () => {
      (prisma.notification.findMany as any).mockResolvedValue([]);

      await request(app)
        .get('/api/notifications')
        .query({ limit: '500' });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('handles null metadata', async () => {
      (prisma.notification.findMany as any).mockResolvedValue([
        { ...mockNotification, metadata: null },
      ]);

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(200);
      expect(res.body[0].metadata).toBeNull();
    });

    it('returns 500 on database error', async () => {
      (prisma.notification.findMany as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch notifications');
    });
  });

  describe('GET /api/notifications/count', () => {
    it('returns unread count', async () => {
      (prisma.notification.count as any).mockResolvedValue(7);

      const res = await request(app).get('/api/notifications/count');

      expect(res.status).toBe(200);
      expect(res.body.unreadCount).toBe(7);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: TEST_USER_ID, read: false },
      });
    });

    it('returns zero when no unread', async () => {
      (prisma.notification.count as any).mockResolvedValue(0);

      const res = await request(app).get('/api/notifications/count');

      expect(res.status).toBe(200);
      expect(res.body.unreadCount).toBe(0);
    });

    it('returns 500 on database error', async () => {
      (prisma.notification.count as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).get('/api/notifications/count');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch unread count');
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('marks notification as read', async () => {
      (prisma.notification.findFirst as any).mockResolvedValue(mockNotification);
      (prisma.notification.update as any).mockResolvedValue(mockNotificationRead);

      const res = await request(app).patch('/api/notifications/notif-1/read');

      expect(res.status).toBe(200);
      expect(res.body.read).toBe(true);
      expect(res.body.metadata).toEqual({ orderId: 'order-1' });
      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: TEST_USER_ID },
      });
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { read: true },
      });
    });

    it('returns 404 when notification not found', async () => {
      (prisma.notification.findFirst as any).mockResolvedValue(null);

      const res = await request(app).patch('/api/notifications/nope/read');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Notification not found');
    });

    it('returns 500 on database error', async () => {
      (prisma.notification.findFirst as any).mockResolvedValue(mockNotification);
      (prisma.notification.update as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).patch('/api/notifications/notif-1/read');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to mark as read');
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('marks all notifications as read', async () => {
      (prisma.notification.updateMany as any).mockResolvedValue({ count: 5 });

      const res = await request(app).patch('/api/notifications/read-all');

      expect(res.status).toBe(200);
      expect(res.body.updatedCount).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: TEST_USER_ID, read: false },
        data: { read: true },
      });
    });

    it('returns zero when none to update', async () => {
      (prisma.notification.updateMany as any).mockResolvedValue({ count: 0 });

      const res = await request(app).patch('/api/notifications/read-all');

      expect(res.status).toBe(200);
      expect(res.body.updatedCount).toBe(0);
    });

    it('returns 500 on database error', async () => {
      (prisma.notification.updateMany as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).patch('/api/notifications/read-all');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to mark all as read');
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('deletes a notification', async () => {
      (prisma.notification.findFirst as any).mockResolvedValue(mockNotification);
      (prisma.notification.delete as any).mockResolvedValue(mockNotification);

      const res = await request(app).delete('/api/notifications/notif-1');

      expect(res.status).toBe(204);
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
    });

    it('returns 404 when notification not found', async () => {
      (prisma.notification.findFirst as any).mockResolvedValue(null);

      const res = await request(app).delete('/api/notifications/nope');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Notification not found');
    });

    it('returns 500 on database error', async () => {
      (prisma.notification.findFirst as any).mockResolvedValue(mockNotification);
      (prisma.notification.delete as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).delete('/api/notifications/notif-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to delete notification');
    });
  });
});

// =============================================================================
// Portal Notification Routes
// =============================================================================

describe('Portal Notification Routes', () => {
  describe('GET /api/notifications/portal', () => {
    it('returns portal notifications for seller', async () => {
      (portalNotificationService.getForPortal as any).mockResolvedValue([mockNotification]);

      const res = await request(app)
        .get('/api/notifications/portal')
        .query({ portalType: 'seller' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].metadata).toEqual({ orderId: 'order-1' });
      expect(portalNotificationService.getForPortal).toHaveBeenCalledWith(
        TEST_USER_ID,
        'seller',
        expect.objectContaining({ limit: 50, offset: 0 })
      );
    });

    it('filters by unread and action required', async () => {
      (portalNotificationService.getForPortal as any).mockResolvedValue([]);

      await request(app)
        .get('/api/notifications/portal')
        .query({ unreadOnly: 'true', actionRequired: 'true' });

      expect(portalNotificationService.getForPortal).toHaveBeenCalledWith(
        TEST_USER_ID,
        'seller',
        expect.objectContaining({ unreadOnly: true, actionRequired: true })
      );
    });

    it('returns 500 on service error', async () => {
      (portalNotificationService.getForPortal as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).get('/api/notifications/portal');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch notifications');
    });
  });

  describe('GET /api/notifications/portal/count', () => {
    it('returns portal unread count', async () => {
      (portalNotificationService.getUnreadCount as any).mockResolvedValue({ total: 3, actionRequired: 1 });

      const res = await request(app)
        .get('/api/notifications/portal/count')
        .query({ portalType: 'buyer' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ total: 3, actionRequired: 1 });
    });

    it('returns 500 on service error', async () => {
      (portalNotificationService.getUnreadCount as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).get('/api/notifications/portal/count');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch count');
    });
  });

  describe('PATCH /api/notifications/portal/read-all', () => {
    it('marks all portal notifications as read', async () => {
      (portalNotificationService.markAllAsRead as any).mockResolvedValue(4);

      const res = await request(app)
        .patch('/api/notifications/portal/read-all')
        .query({ portalType: 'seller' });

      expect(res.status).toBe(200);
      expect(res.body.updatedCount).toBe(4);
    });

    it('returns 500 on service error', async () => {
      (portalNotificationService.markAllAsRead as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).patch('/api/notifications/portal/read-all');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to mark all as read');
    });
  });
});

// =============================================================================
// Notification Preferences Routes
// =============================================================================

describe('Notification Preferences Routes', () => {
  const mockPreferences = {
    id: 'pref-1',
    userId: TEST_USER_ID,
    emailEnabled: true,
    emailMentions: true,
    emailDigest: 'daily',
    pushEnabled: true,
    quietHoursEnabled: false,
  };

  describe('GET /api/notifications/preferences', () => {
    it('returns existing preferences', async () => {
      (prisma.notificationPreference.findUnique as any).mockResolvedValue(mockPreferences);

      const res = await request(app).get('/api/notifications/preferences');

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(TEST_USER_ID);
      expect(res.body.emailEnabled).toBe(true);
    });

    it('creates default preferences when none exist', async () => {
      (prisma.notificationPreference.findUnique as any).mockResolvedValue(null);
      (prisma.notificationPreference.create as any).mockResolvedValue(mockPreferences);

      const res = await request(app).get('/api/notifications/preferences');

      expect(res.status).toBe(200);
      expect(prisma.notificationPreference.create).toHaveBeenCalledWith({
        data: { userId: TEST_USER_ID },
      });
    });

    it('returns 500 on database error', async () => {
      (prisma.notificationPreference.findUnique as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).get('/api/notifications/preferences');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch preferences');
    });
  });

  describe('PATCH /api/notifications/preferences', () => {
    it('updates preferences with valid data', async () => {
      const updated = { ...mockPreferences, emailDigest: 'weekly' };
      (prisma.notificationPreference.upsert as any).mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/notifications/preferences')
        .send({ emailDigest: 'weekly' });

      expect(res.status).toBe(200);
      expect(res.body.emailDigest).toBe('weekly');
    });

    it('updates multiple preferences at once', async () => {
      const updated = { ...mockPreferences, emailEnabled: false, pushEnabled: false };
      (prisma.notificationPreference.upsert as any).mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/notifications/preferences')
        .send({ emailEnabled: false, pushEnabled: false });

      expect(res.status).toBe(200);
      expect(res.body.emailEnabled).toBe(false);
      expect(res.body.pushEnabled).toBe(false);
    });

    it('returns 400 for invalid emailDigest value', async () => {
      const res = await request(app)
        .patch('/api/notifications/preferences')
        .send({ emailDigest: 'hourly' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 400 for invalid quiet hours format', async () => {
      const res = await request(app)
        .patch('/api/notifications/preferences')
        .send({ quietHoursStart: 'not-a-time' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('accepts valid quiet hours format', async () => {
      const updated = { ...mockPreferences, quietHoursStart: '22:00', quietHoursEnd: '07:00' };
      (prisma.notificationPreference.upsert as any).mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/notifications/preferences')
        .send({ quietHoursStart: '22:00', quietHoursEnd: '07:00' });

      expect(res.status).toBe(200);
      expect(res.body.quietHoursStart).toBe('22:00');
    });

    it('returns 500 on database error', async () => {
      (prisma.notificationPreference.upsert as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app)
        .patch('/api/notifications/preferences')
        .send({ emailEnabled: true });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to update preferences');
    });
  });
});
