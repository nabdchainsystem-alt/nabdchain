import express, { Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// Valid template categories
const TEMPLATE_CATEGORIES = [
    'project_management',
    'marketing',
    'sales',
    'hr',
    'software',
    'design',
    'operations',
    'education',
    'personal',
    'startup',
    'finance',
    'custom',
] as const;

// Input validation schemas
const createTemplateSchema = z.object({
    name: z.string().min(1, 'Name required').max(100),
    description: z.string().optional(),
    category: z.enum(TEMPLATE_CATEGORIES),
    subcategory: z.string().optional(),
    thumbnail: z.string().url().optional(),
    isPublic: z.boolean().optional(),
    content: z.object({
        board: z.object({
            name: z.string(),
            description: z.string().optional(),
            defaultView: z.string(),
            availableViews: z.array(z.string()),
        }),
        columns: z.array(z.object({
            id: z.string(),
            name: z.string(),
            type: z.string(),
            config: z.record(z.string(), z.unknown()).optional(),
            order: z.number(),
        })),
        rooms: z.array(z.object({
            id: z.string(),
            name: z.string(),
            color: z.string(),
            order: z.number(),
            rows: z.array(z.object({
                id: z.string(),
                name: z.string(),
                values: z.record(z.string(), z.unknown()),
            })),
        })),
        automations: z.array(z.object({
            id: z.string(),
            name: z.string(),
            trigger: z.record(z.string(), z.unknown()),
            actions: z.array(z.record(z.string(), z.unknown())),
        })).optional(),
    }),
    tags: z.array(z.string()).optional(),
});

const updateTemplateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional().nullable(),
    category: z.enum(TEMPLATE_CATEGORIES).optional(),
    subcategory: z.string().optional().nullable(),
    thumbnail: z.string().url().optional().nullable(),
    isPublic: z.boolean().optional(),
    content: z.object({
        board: z.object({
            name: z.string(),
            description: z.string().optional(),
            defaultView: z.string(),
            availableViews: z.array(z.string()),
        }),
        columns: z.array(z.unknown()),
        rooms: z.array(z.unknown()),
        automations: z.array(z.unknown()).optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
});

const listTemplatesSchema = z.object({
    category: z.enum(TEMPLATE_CATEGORIES).optional(),
    search: z.string().optional(),
    publicOnly: z.string().transform(v => v === 'true').optional(),
    limit: z.string().transform(Number).optional(),
    offset: z.string().transform(Number).optional(),
});

// GET /templates - List templates
router.get('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const query = listTemplatesSchema.parse(req.query);

        // Get user's workspace IDs
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { workspaceId: true },
        });

        const where: {
            OR?: Array<{ isPublic?: boolean; workspaceId?: string | null; createdById?: string }>;
            isPublic?: boolean;
            category?: string;
            OR_search?: Array<{ name?: { contains: string }; description?: { contains: string } }>;
        } = {};

        // Public templates or user's own/workspace templates
        if (query.publicOnly) {
            where.isPublic = true;
        } else {
            where.OR = [
                { isPublic: true },
                { createdById: userId },
                ...(user?.workspaceId ? [{ workspaceId: user.workspaceId }] : []),
            ];
        }

        if (query.category) {
            where.category = query.category;
        }

        // Build search conditions separately
        let searchCondition: { OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } }> } | undefined;
        if (query.search) {
            searchCondition = {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { description: { contains: query.search, mode: 'insensitive' } },
                ],
            };
        }

        const templates = await prisma.template.findMany({
            where: {
                ...where,
                ...searchCondition,
            },
            orderBy: [
                { usageCount: 'desc' },
                { createdAt: 'desc' },
            ],
            take: query.limit || 50,
            skip: query.offset || 0,
        });

        // Transform content and tags from JSON strings
        const transformed = templates.map(t => ({
            ...t,
            content: JSON.parse(t.content),
            tags: t.tags ? JSON.parse(t.tags) : [],
        }));

        apiLogger.debug('[Templates] Fetched templates', { userId, count: templates.length });
        return res.json(transformed);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid query parameters', details: error.issues });
        }
        apiLogger.error('[Templates] Error fetching templates', error);
        return res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// GET /templates/categories - Get available categories
router.get('/categories', requireAuth, async (_req, res: Response) => {
    return res.json(TEMPLATE_CATEGORIES);
});

// GET /templates/:id - Get a specific template
router.get('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        const template = await prisma.template.findUnique({
            where: { id },
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Check access: public or owner/workspace member
        if (!template.isPublic && template.createdById !== userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { workspaceId: true },
            });
            if (template.workspaceId !== user?.workspaceId) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        return res.json({
            ...template,
            content: JSON.parse(template.content),
            tags: template.tags ? JSON.parse(template.tags) : [],
        });
    } catch (error) {
        apiLogger.error('[Templates] Error fetching template', error);
        return res.status(500).json({ error: 'Failed to fetch template' });
    }
});

// POST /templates - Create a new template
router.post('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const validatedData = createTemplateSchema.parse(req.body);

        // Get user's workspace
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { workspaceId: true },
        });

        const template = await prisma.template.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                category: validatedData.category,
                subcategory: validatedData.subcategory,
                thumbnail: validatedData.thumbnail,
                isPublic: validatedData.isPublic ?? false,
                workspaceId: user?.workspaceId,
                createdById: userId,
                content: JSON.stringify(validatedData.content),
                tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
            },
        });

        apiLogger.info('[Templates] Created template', { templateId: template.id, userId });
        return res.status(201).json({
            ...template,
            content: JSON.parse(template.content),
            tags: template.tags ? JSON.parse(template.tags) : [],
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('[Templates] Error creating template', error);
        return res.status(500).json({ error: 'Failed to create template' });
    }
});

// POST /templates/:id/use - Create a board from a template
router.post('/:id/use', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { boardName } = req.body;

        if (!boardName || typeof boardName !== 'string') {
            return res.status(400).json({ error: 'Board name required' });
        }

        // Get template
        const template = await prisma.template.findUnique({
            where: { id },
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Check access
        if (!template.isPublic && template.createdById !== userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { workspaceId: true },
            });
            if (template.workspaceId !== user?.workspaceId) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const content = JSON.parse(template.content);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { workspaceId: true },
        });

        // Create board from template
        const board = await prisma.board.create({
            data: {
                userId,
                workspaceId: user?.workspaceId,
                name: boardName,
                description: content.board.description,
                defaultView: content.board.defaultView,
                availableViews: JSON.stringify(content.board.availableViews),
                columns: JSON.stringify(content.columns),
            },
        });

        // Create rooms from template
        for (const roomData of content.rooms) {
            const room = await prisma.room.create({
                data: {
                    userId,
                    name: roomData.name,
                    type: 'table',
                },
            });

            // Create column store for this room
            await prisma.columnStore.create({
                data: {
                    roomId: room.id,
                    columns: JSON.stringify(content.columns),
                },
            });

            // Create rows for this room
            for (const rowData of roomData.rows) {
                await prisma.row.create({
                    data: {
                        roomId: room.id,
                        content: JSON.stringify({
                            name: rowData.name,
                            ...rowData.values,
                        }),
                    },
                });
            }
        }

        // Increment usage count
        await prisma.template.update({
            where: { id },
            data: { usageCount: { increment: 1 } },
        });

        apiLogger.info('[Templates] Created board from template', {
            templateId: id,
            boardId: board.id,
            userId,
        });

        return res.status(201).json({ boardId: board.id });
    } catch (error) {
        apiLogger.error('[Templates] Error creating board from template', error);
        return res.status(500).json({ error: 'Failed to create board from template' });
    }
});

// POST /templates/from-board - Save a board as a template
router.post('/from-board', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { boardId, name, description, category, tags, isPublic } = req.body;

        if (!boardId || !name || !category) {
            return res.status(400).json({ error: 'Board ID, name, and category required' });
        }

        // Get board
        const board = await prisma.board.findFirst({
            where: { id: boardId, userId },
        });

        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }

        // Get rooms for this board (rooms associated with boards through workspaceId)
        const rooms = await prisma.room.findMany({
            where: { userId },
            include: {
                rows: true,
                columnStores: true,
            },
        });

        // Build template content
        const columns = board.columns ? JSON.parse(board.columns) : [];
        const templateRooms = rooms.map(room => ({
            id: room.id,
            name: room.name,
            color: '#3B82F6',
            order: 0,
            rows: room.rows.map(row => {
                const content = JSON.parse(row.content);
                return {
                    id: row.id,
                    name: content.name || 'Item',
                    values: content,
                };
            }),
        }));

        const content = {
            board: {
                name: board.name,
                description: board.description || '',
                defaultView: board.defaultView || 'table',
                availableViews: board.availableViews ? JSON.parse(board.availableViews) : ['table'],
            },
            columns,
            rooms: templateRooms,
        };

        // Get user's workspace
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { workspaceId: true },
        });

        // Create template
        const template = await prisma.template.create({
            data: {
                name,
                description,
                category,
                isPublic: isPublic ?? false,
                workspaceId: user?.workspaceId,
                createdById: userId,
                content: JSON.stringify(content),
                tags: tags ? JSON.stringify(tags) : null,
            },
        });

        apiLogger.info('[Templates] Created template from board', {
            templateId: template.id,
            boardId,
            userId,
        });

        return res.status(201).json({
            ...template,
            content: JSON.parse(template.content),
            tags: template.tags ? JSON.parse(template.tags) : [],
        });
    } catch (error) {
        apiLogger.error('[Templates] Error creating template from board', error);
        return res.status(500).json({ error: 'Failed to create template' });
    }
});

// PATCH /templates/:id - Update a template
router.patch('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const validatedData = updateTemplateSchema.parse(req.body);

        // Verify ownership
        const existing = await prisma.template.findFirst({
            where: { id, createdById: userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Template not found or not owned by user' });
        }

        const updateData: Record<string, unknown> = {};
        if (validatedData.name !== undefined) updateData.name = validatedData.name;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.category !== undefined) updateData.category = validatedData.category;
        if (validatedData.subcategory !== undefined) updateData.subcategory = validatedData.subcategory;
        if (validatedData.thumbnail !== undefined) updateData.thumbnail = validatedData.thumbnail;
        if (validatedData.isPublic !== undefined) updateData.isPublic = validatedData.isPublic;
        if (validatedData.content !== undefined) updateData.content = JSON.stringify(validatedData.content);
        if (validatedData.tags !== undefined) updateData.tags = JSON.stringify(validatedData.tags);

        const updated = await prisma.template.update({
            where: { id },
            data: updateData,
        });

        apiLogger.debug('[Templates] Updated template', { templateId: id });
        return res.json({
            ...updated,
            content: JSON.parse(updated.content),
            tags: updated.tags ? JSON.parse(updated.tags) : [],
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('[Templates] Error updating template', error);
        return res.status(500).json({ error: 'Failed to update template' });
    }
});

// DELETE /templates/:id - Delete a template
router.delete('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        // Verify ownership
        const existing = await prisma.template.findFirst({
            where: { id, createdById: userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Template not found or not owned by user' });
        }

        await prisma.template.delete({
            where: { id },
        });

        apiLogger.debug('[Templates] Deleted template', { templateId: id });
        return res.status(204).send();
    } catch (error) {
        apiLogger.error('[Templates] Error deleting template', error);
        return res.status(500).json({ error: 'Failed to delete template' });
    }
});

export default router;
