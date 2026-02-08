/**
 * Integration tests for Vault Routes
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
    vaultItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import vaultRouter from '../../../routes/vaultRoutes';
import { prisma } from '../../../lib/prisma';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const TEST_USER_ID = 'test-user-id';
const OTHER_USER_ID = 'other-user-id';
const app = createTestApp(vaultRouter, '/api/vault', { userId: TEST_USER_ID });

const mockVaultItem = {
  id: 'vault-1',
  userId: TEST_USER_ID,
  title: 'My Document',
  type: 'document',
  subtitle: 'A test document',
  content: 'Document content here',
  metadata: null,
  isFavorite: false,
  folderId: null,
  color: null,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
};

const mockFolder = {
  id: 'folder-1',
  userId: TEST_USER_ID,
  title: 'My Folder',
  type: 'folder',
  subtitle: null,
  content: null,
  metadata: null,
  isFavorite: false,
  folderId: null,
  color: '#FF0000',
  createdAt: new Date('2026-01-10'),
  updatedAt: new Date('2026-01-10'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// GET Routes
// =============================================================================

describe('GET /api/vault', () => {
  it('returns all vault items for user', async () => {
    (prisma.vaultItem.findMany as any).mockResolvedValue([mockVaultItem, mockFolder]);

    const res = await request(app).get('/api/vault');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(prisma.vaultItem.findMany).toHaveBeenCalledWith({
      where: { userId: TEST_USER_ID },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns empty array when no items', async () => {
    (prisma.vaultItem.findMany as any).mockResolvedValue([]);

    const res = await request(app).get('/api/vault');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    (prisma.vaultItem.findMany as any).mockRejectedValue(new Error('DB down'));

    const res = await request(app).get('/api/vault');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch vault items');
  });
});

// =============================================================================
// POST Routes (Create)
// =============================================================================

describe('POST /api/vault', () => {
  const validItem = {
    title: 'New Document',
    type: 'document' as const,
  };

  it('creates a vault item with minimal data', async () => {
    const created = { id: 'vault-new', userId: TEST_USER_ID, ...validItem };
    (prisma.vaultItem.create as any).mockResolvedValue(created);

    const res = await request(app)
      .post('/api/vault')
      .send(validItem);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('vault-new');
    expect(prisma.vaultItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'New Document',
        type: 'document',
        userId: TEST_USER_ID,
        folderId: null,
      }),
    });
  });

  it('creates a vault item with all fields', async () => {
    const fullItem = {
      title: 'Full Document',
      type: 'note' as const,
      subtitle: 'A complete note',
      content: 'Note content',
      metadata: '{"key":"value"}',
      isFavorite: true,
      folderId: '550e8400-e29b-41d4-a716-446655440000',
      color: '#00FF00',
    };
    const created = { id: 'vault-full', userId: TEST_USER_ID, ...fullItem };
    (prisma.vaultItem.create as any).mockResolvedValue(created);

    const res = await request(app)
      .post('/api/vault')
      .send(fullItem);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('vault-full');
  });

  it('creates a folder type item', async () => {
    const folder = { title: 'New Folder', type: 'folder' };
    const created = { id: 'folder-new', userId: TEST_USER_ID, ...folder };
    (prisma.vaultItem.create as any).mockResolvedValue(created);

    const res = await request(app)
      .post('/api/vault')
      .send(folder);

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('folder');
  });

  it('returns 400 for missing title', async () => {
    const res = await request(app)
      .post('/api/vault')
      .send({ type: 'document' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });

  it('returns 400 for empty title', async () => {
    const res = await request(app)
      .post('/api/vault')
      .send({ title: '', type: 'document' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });

  it('returns 400 for missing type', async () => {
    const res = await request(app)
      .post('/api/vault')
      .send({ title: 'My Doc' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });

  it('returns 400 for invalid type enum', async () => {
    const res = await request(app)
      .post('/api/vault')
      .send({ title: 'My Doc', type: 'spreadsheet' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });

  it('returns 400 for invalid folderId format', async () => {
    const res = await request(app)
      .post('/api/vault')
      .send({ title: 'My Doc', type: 'document', folderId: 'not-a-uuid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });

  it('returns 500 on database error', async () => {
    (prisma.vaultItem.create as any).mockRejectedValue(new Error('DB down'));

    const res = await request(app)
      .post('/api/vault')
      .send(validItem);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create vault item');
  });
});

// =============================================================================
// PUT Routes (Update)
// =============================================================================

describe('PUT /api/vault/:id', () => {
  it('updates a vault item with valid data', async () => {
    (prisma.vaultItem.findUnique as any).mockResolvedValue(mockVaultItem);
    const updated = { ...mockVaultItem, title: 'Updated Title' };
    (prisma.vaultItem.update as any).mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/vault/vault-1')
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });

  it('updates subtitle and content', async () => {
    (prisma.vaultItem.findUnique as any).mockResolvedValue(mockVaultItem);
    const updated = { ...mockVaultItem, subtitle: 'New subtitle', content: 'New content' };
    (prisma.vaultItem.update as any).mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/vault/vault-1')
      .send({ subtitle: 'New subtitle', content: 'New content' });

    expect(res.status).toBe(200);
    expect(res.body.subtitle).toBe('New subtitle');
    expect(res.body.content).toBe('New content');
  });

  it('updates isFavorite flag', async () => {
    (prisma.vaultItem.findUnique as any).mockResolvedValue(mockVaultItem);
    const updated = { ...mockVaultItem, isFavorite: true };
    (prisma.vaultItem.update as any).mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/vault/vault-1')
      .send({ isFavorite: true });

    expect(res.status).toBe(200);
    expect(res.body.isFavorite).toBe(true);
  });

  it('returns 404 when item not found', async () => {
    (prisma.vaultItem.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/vault/nope')
      .send({ title: 'New Title' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Item not found');
  });

  it('returns 404 when item belongs to another user', async () => {
    (prisma.vaultItem.findUnique as any).mockResolvedValue({
      ...mockVaultItem,
      userId: OTHER_USER_ID,
    });

    const res = await request(app)
      .put('/api/vault/vault-1')
      .send({ title: 'New Title' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Item not found');
  });

  it('returns 400 for invalid type value', async () => {
    const res = await request(app)
      .put('/api/vault/vault-1')
      .send({ type: 'spreadsheet' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });

  it('returns 500 on database error during update', async () => {
    (prisma.vaultItem.findUnique as any).mockResolvedValue(mockVaultItem);
    (prisma.vaultItem.update as any).mockRejectedValue(new Error('DB down'));

    const res = await request(app)
      .put('/api/vault/vault-1')
      .send({ title: 'New Title' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to update vault item');
  });
});

// =============================================================================
// DELETE Routes
// =============================================================================

describe('DELETE /api/vault/:id', () => {
  it('deletes a vault item', async () => {
    (prisma.vaultItem.findUnique as any).mockResolvedValue(mockVaultItem);
    (prisma.vaultItem.delete as any).mockResolvedValue(mockVaultItem);

    const res = await request(app).delete('/api/vault/vault-1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prisma.vaultItem.delete).toHaveBeenCalledWith({
      where: { id: 'vault-1' },
    });
  });

  it('returns 404 when item not found', async () => {
    (prisma.vaultItem.findUnique as any).mockResolvedValue(null);

    const res = await request(app).delete('/api/vault/nope');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Item not found');
  });

  it('returns 404 when item belongs to another user', async () => {
    (prisma.vaultItem.findUnique as any).mockResolvedValue({
      ...mockVaultItem,
      userId: OTHER_USER_ID,
    });

    const res = await request(app).delete('/api/vault/vault-1');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Item not found');
  });

  it('returns 500 on database error', async () => {
    (prisma.vaultItem.findUnique as any).mockResolvedValue(mockVaultItem);
    (prisma.vaultItem.delete as any).mockRejectedValue(new Error('DB down'));

    const res = await request(app).delete('/api/vault/vault-1');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to delete vault item');
  });
});
